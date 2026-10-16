import { useState } from "react";
import ReceivedDocs from "../components/ReceivedDocs";
import ChatScreen from "../components/ChatScreen";

const API_URL = "http://localhost:8000";

export default function RAGWorkspace() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const askQuestion = async (q) => {
    const trimmedQuestion = q.trim();

    if (!trimmedQuestion || loading) return;

    /*
     * Immediately add the user's question to the chat.
     */
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmedQuestion,
      },
    ]);

    // Clear input immediately
    setQuestion("");

    setLoading(true);
    setStatus("Thinking...");

    try {
      console.log("Sending question:", trimmedQuestion);

      const response = await fetch(`${API_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: trimmedQuestion,
          thread_id: "rag-session-1",
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `API Error ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      console.log("RAG RESPONSE:", data);

      /*
       * Update retrieved documents
       */
      setSources(data.sources || []);

      /*
       * Update status
       */
      setStatus(data.status || "Completed");

      /*
       * Add assistant answer BELOW the question
       */
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            data.answer ||
            "The RAG agent did not return an answer.",
          process: data.throught_process || [],
          status: data.status,
        },
      ]);
    } catch (error) {
      console.error("RAG ERROR:", error);

      setStatus("Error");

      /*
       * Show error as assistant response
       */
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error.message ||
            "Something went wrong while processing your question.",
          process: [],
          status: "Error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7fa] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1500px] flex-col gap-4 lg:h-[calc(100vh-48px)] lg:flex-row">

        {/* LEFT - RETRIEVED DOCUMENTS */}
        <div className="min-h-[350px] w-full lg:h-full lg:w-[40%] xl:w-[38%]">
          <ReceivedDocs documents={sources} />
        </div>

        {/* RIGHT - CHAT */}
        <div className="min-h-[600px] flex-1 lg:h-full">
          <ChatScreen
            messages={messages}
            question={question}
            onQuestionChange={setQuestion}
            onSubmit={askQuestion}
            loading={loading}
            status={status}
          />
        </div>

      </div>
    </main>
  );
}