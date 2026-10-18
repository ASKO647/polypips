"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Archive, BarChart3, ChevronLeft, ChevronRight, CircleHelp, Database, Folder,
  History, Link2, MessageCircle, MoreHorizontal, Plus, Settings, ShieldCheck,
  Sparkles, WalletCards, X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ChatInput } from "@/components/dashboard/coach/chat-input";
import { ChatMessage } from "@/components/dashboard/coach/chat-message";
import { TypingIndicator } from "@/components/dashboard/coach/typing-indicator";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { coachChatErrorMessage, type ConversationSummary, type Message, type QuickQuestion } from "@/lib/data/coach";
import { CoachChatError, runCoachChat } from "@/lib/supabase/coach-chat-client";
import { createClient } from "@/lib/supabase/client";
import { fetchConversationMessages } from "@/lib/supabase/coach";
import styles from "./coach-workspace.module.css";

type FocusAnalysis = { id: string; question: string };
type ConnectorState = "idle" | "connecting" | "checking" | "connected";

const COPY = {
  fr: {
    ready: "Prêt à analyser", discussion: "Discussion", artifacts: "Artefacts",
    welcome: "Comment puis-je vous aider aujourd’hui ?",
    intro: "Posez vos questions sur vos analyses, explorez les marchés et obtenez des éclairages personnalisés.",
    tools: "Outils & contexte", sources: "Sources connectées", addMcp: "Ajouter un connecteur MCP",
    discussionSources: "Sources de cette discussion", noSource: "Aucune source spécifique",
    noSourceText: "Les sources utilisées dans cette discussion apparaîtront ici.", secure: "Connexion sécurisée",
    secureText: "Vos données sont protégées et utilisées uniquement pour vos analyses.",
    nav: ["Discussions", "Projets", "Analyses", "Connecteurs MCP"], recent: "Conversations récentes",
    all: "Voir toutes les conversations", collapse: "Réduire le menu", openTools: "Ouvrir les outils",
    polymarket: "Polymarket", wallet: "Portefeuille", sport: "Données sportives", connected: "Connecté", readOnly: "Lecture seule",
    mcpTitle: "Connecter une source MCP", mcpText: "Préparez une nouvelle source de données pour le Coach IA.",
    endpoint: "URL du serveur MCP", connect: "Tester la connexion", connecting: "Connexion au serveur…",
    checking: "Vérification des permissions…", confirmed: "Connecteur prêt", close: "Fermer",
  },
  en: {
    ready: "Ready to analyse", discussion: "Discussion", artifacts: "Artifacts",
    welcome: "How can I help you today?",
    intro: "Ask questions about your analyses, explore markets and get personalised insights.",
    tools: "Tools & context", sources: "Connected sources", addMcp: "Add an MCP connector",
    discussionSources: "Sources in this chat", noSource: "No specific source",
    noSourceText: "Sources used in this discussion will appear here.", secure: "Secure connection",
    secureText: "Your data is protected and used only for your analyses.",
    nav: ["Discussions", "Projects", "Analyses", "MCP connectors"], recent: "Recent conversations",
    all: "View all conversations", collapse: "Collapse menu", openTools: "Open tools",
    polymarket: "Polymarket", wallet: "Portfolio", sport: "Sports data", connected: "Connected", readOnly: "Read only",
    mcpTitle: "Connect an MCP source", mcpText: "Prepare a new data source for the AI Coach.",
    endpoint: "MCP server URL", connect: "Test connection", connecting: "Connecting to server…",
    checking: "Checking permissions…", confirmed: "Connector ready", close: "Close",
  },
} as const;

function errorContentFor(error: unknown, t: (key: string) => string): React.ReactNode {
  if (error instanceof CoachChatError && error.code === "limit_reached") {
    return <>{error.message} <Link href="/dashboard/settings">{t("changePlanLink")}</Link></>;
  }
  return coachChatErrorMessage(error instanceof CoachChatError ? error.code : "unknown", t);
}

export function CoachFlow({ initialConversations, initialFocusAnalysis, hasActiveSubscription, cancelled }: {
  initialConversations: ConversationSummary[];
  initialFocusAnalysis: FocusAnalysis | null;
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const locale = useLocale();
  const c = COPY[locale === "en" ? "en" : "fr"];
  const t = useTranslations("Coach");
  const welcomeMessage: Message = { id: "welcome", role: "assistant", content: t("welcomeMessage") };
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);
  const [focusAnalysis, setFocusAnalysis] = useState<FocusAnalysis | null>(initialFocusAnalysis);
  const [collapsed, setCollapsed] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"discussion" | "artifacts">("discussion");
  const [mcpOpen, setMcpOpen] = useState(false);
  const [connectorState, setConnectorState] = useState<ConnectorState>("idle");
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isWelcome = messages.length === 1 && messages[0]?.id === "welcome" && !activeConversationId;

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, showTyping]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 4000); return () => clearTimeout(timer); }, [toast]);

  const handleNewConversation = () => {
    setMessages((current) => current.length > 1 ? [] : current);
    window.setTimeout(() => {
      setActiveConversationId(null); setMessages([welcomeMessage]); setInputValue(""); setErrorMessage(null); setFocusAnalysis(null);
    }, 180);
  };

  const handleSelectConversation = async (id: string) => {
    if (id === activeConversationId) return;
    setErrorMessage(null); setFocusAnalysis(null); setActiveConversationId(id); setLoadingConversation(true);
    try {
      const msgs = await fetchConversationMessages(createClient(), id);
      setMessages(msgs.length > 0 ? msgs : [welcomeMessage]);
    } finally { setLoadingConversation(false); }
  };

  const bumpConversation = (id: string, title: string) => setConversations((prev) => [
    { id, title, updatedAt: new Date().toISOString() }, ...prev.filter((item) => item.id !== id),
  ]);

  const handleStop = () => {
    abortRef.current?.abort(); abortRef.current = null; setSending(false); setShowTyping(false);
    setToast(locale === "en" ? "Generation stopped" : "Génération arrêtée");
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending || !hasActiveSubscription) return;
    const controller = new AbortController(); abortRef.current = controller;
    setErrorMessage(null); setInputValue("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setSending(true); setShowTyping(true);
    const assistantId = crypto.randomUUID(); let assistantStarted = false; const conversationIdAtSend = activeConversationId;
    try {
      const result = await runCoachChat(
        { conversationId: conversationIdAtSend, message: trimmed, focusAnalysisId: conversationIdAtSend ? undefined : focusAnalysis?.id },
        (delta) => {
          if (!assistantStarted) {
            assistantStarted = true; setShowTyping(false);
            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: delta }]);
          } else setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + delta } : m));
        },
        controller.signal,
      );
      setFocusAnalysis(null); if (!conversationIdAtSend) setActiveConversationId(result.conversationId); bumpConversation(result.conversationId, result.title);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setErrorMessage(errorContentFor(error, t));
    } finally { abortRef.current = null; setShowTyping(false); setSending(false); }
  };

  const connectMcp = () => {
    if (connectorState === "connected") { setMcpOpen(false); return; }
    setConnectorState("connecting");
    window.setTimeout(() => setConnectorState("checking"), 800);
    window.setTimeout(() => { setConnectorState("connected"); setToast(c.confirmed); }, 1700);
  };

  return (
    <div className={styles.workspace} data-collapsed={collapsed} data-chatting={!isWelcome}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><Image src="/polypips-mark.png" alt="" width={36} height={40} /><strong>Polypips</strong><button onClick={() => setCollapsed((v) => !v)} aria-label={c.collapse}>{collapsed ? <ChevronRight /> : <ChevronLeft />}</button></div>
        <button className={styles.newChat} onClick={handleNewConversation}><Plus /><span>{t("Sidebar.newConversation")}</span></button>
        <nav className={styles.coachNav}>
          {[MessageCircle, Folder, BarChart3, Link2].map((Icon, index) => <button className={index === 0 ? styles.navActive : ""} key={c.nav[index]} onClick={() => index === 3 && setMcpOpen(true)}><Icon /><span>{c.nav[index]}</span></button>)}
        </nav>
        <div className={styles.recent}><p>{c.recent}</p>{conversations.slice(0, 5).map((conv) => <button key={conv.id} data-active={conv.id === activeConversationId} onClick={() => handleSelectConversation(conv.id)}><MessageCircle /><span><strong>{conv.title}</strong><small>{new Date(conv.updatedAt).toLocaleDateString(locale)}</small></span></button>)}<button className={styles.allChats}><span>{c.all}</span><ChevronRight /></button></div>
        <Link href="/dashboard/settings" className={styles.profile}><span>S</span><span><strong>Sébastien</strong><small>Compte Polypips Pro</small></span><Settings /></Link>
      </aside>

      <LockedOverlay locked={!hasActiveSubscription} cancelled={cancelled} message={cancelled ? t("lockedMessageCancelled") : t("lockedMessage")} className={styles.chatShell} contentClassName={styles.chatInner}>
        <header className={styles.header}>
          <div><h1>{t("headerTitle")}</h1><span><i />{c.ready}</span></div>
          <div className={styles.headerActions}><button><History /></button><button><MoreHorizontal /></button><button className={styles.mobileTools} onClick={() => setToolsOpen(true)} aria-label={c.openTools}><Database /></button></div>
        </header>
        <div className={styles.tabs} data-tab={activeTab}><button onClick={() => setActiveTab("discussion")} data-active={activeTab === "discussion"}><MessageCircle />{c.discussion}</button><button onClick={() => setActiveTab("artifacts")} data-active={activeTab === "artifacts"}><Archive />{c.artifacts}</button><span /></div>

        {activeTab === "discussion" ? <>
          <div ref={scrollRef} className={styles.chatBody}>
            {loadingConversation ? <div className={styles.loading}><span /><span /><span /></div> : isWelcome ? <div className={styles.welcome}>
              <div className={styles.logoHero}><span /><Image src="/polypips-mark.png" alt="" width={60} height={68} /></div>
              <h2>{c.welcome}</h2><p>{c.intro}</p>
              <div className={styles.suggestions}>{[
                ["why-decision", "Expliquer une analyse", "Comprenez les raisons d’une décision et les facteurs clés.", Sparkles],
                ["compare-recent", "Comparer des opportunités", "Analysez plusieurs marchés ou scénarios côte à côte.", BarChart3],
                ["main-risks", "Suivre les risques", "Identifiez les principaux risques et les points de vigilance.", ShieldCheck],
                ["what-could-invalidate", "Résumer un portefeuille", "Obtenez une vue d’ensemble de vos positions et analyses.", WalletCards],
              ].map(([id, title, text, Icon], index) => <button key={String(id)} style={{"--delay": `${300 + index * 70}ms`} as React.CSSProperties} onClick={() => handleSend(t(`ChatInput.quickQuestions.${id}`))}><span><Icon className={styles.suggestionIcon} /></span><span><strong>{locale === "en" ? t(`ChatInput.quickQuestions.${id}`) : String(title)}</strong><small>{String(text)}</small></span><ChevronRight /></button>)}</div>
            </div> : <div className={styles.messages}>{messages.filter((m) => m.id !== "welcome").map((message) => <ChatMessage key={message.id} message={message} />)}{showTyping && <TypingIndicator />}</div>}
          </div>
          {focusAnalysis && !activeConversationId && <div className={styles.contextChip}><span>{t("contextLabel", {question: focusAnalysis.question})}</span><button onClick={() => setFocusAnalysis(null)}><X /></button></div>}
          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
          <ChatInput value={inputValue} onChange={setInputValue} onSend={() => handleSend(inputValue)} onSelectSuggestion={(q: QuickQuestion) => handleSend(q.label)} disabled={!hasActiveSubscription} sending={sending} onStop={handleStop} />
        </> : <div className={styles.artifacts}><Archive /><h2>{locale === "en" ? "Your generated artifacts" : "Vos artefacts générés"}</h2><p>{locale === "en" ? "Tables, summaries and reports created by the Coach will appear here." : "Les tableaux, synthèses et rapports créés par le Coach apparaîtront ici."}</p></div>}
      </LockedOverlay>

      <aside className={`${styles.tools} ${toolsOpen ? styles.toolsOpen : ""}`}>
        <div className={styles.toolsHeader}><h2>{c.tools}</h2><button onClick={() => setToolsOpen(false)}><X /></button><button><Settings /></button></div>
        <h3>{c.sources}</h3>
        <div className={styles.connectors}>{[
          [c.polymarket, c.connected, "poly", true], [c.wallet, c.readOnly, "wallet", false], [c.sport, c.connected, "sport", true],
        ].map(([name, status, kind, online]) => <button key={String(name)}><span data-kind={kind}>{kind === "poly" ? "◇" : kind === "sport" ? "⚽" : "▣"}</span><span><strong>{name}</strong><small><i data-online={online} />{status}</small></span><ChevronRight /></button>)}</div>
        <button className={styles.addMcp} onClick={() => setMcpOpen(true)}><Plus />{c.addMcp}</button>
        <div className={styles.sourcesTitle}><h3>{c.discussionSources}</h3><CircleHelp /></div>
        <div className={styles.emptySource}><Archive /><span><strong>{c.noSource}</strong><small>{c.noSourceText}</small></span></div>
        <div className={styles.secure}><ShieldCheck /><span><strong>{c.secure}</strong><small>{c.secureText}</small></span></div>
      </aside>
      {toolsOpen && <button className={styles.backdrop} onClick={() => setToolsOpen(false)} aria-label={c.close} />}

      {mcpOpen && <div className={styles.modalBackdrop} onClick={() => setMcpOpen(false)}><div className={styles.mcpModal} onClick={(e) => e.stopPropagation()}><button className={styles.modalClose} onClick={() => setMcpOpen(false)}><X /></button><span className={styles.mcpIcon}><Link2 /></span><h2>{c.mcpTitle}</h2><p>{c.mcpText}</p><label>{c.endpoint}<input placeholder="https://mcp.example.com/sse" /></label><div className={styles.connectionSteps}><span data-active={connectorState !== "idle"}><i />{connectorState === "idle" ? c.connect : c.connecting}</span><span data-active={["checking", "connected"].includes(connectorState)}><i />{c.checking}</span><span data-active={connectorState === "connected"}><i />{c.confirmed}</span></div><button className={styles.connectButton} onClick={connectMcp} disabled={connectorState !== "idle" && connectorState !== "connected"}>{connectorState === "connected" ? c.close : c.connect}</button></div></div>}
      {toast && <div className={styles.toast}><ShieldCheck />{toast}</div>}
    </div>
  );
}
