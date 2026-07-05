import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileJson, Send, CheckCircle2 } from "lucide-react";
import { ChatMessage } from "@/pages/Index";
import { toast } from "sonner";
import { getProlificReturnCode } from "@/vars";
import { MaskedWord, PRIVACY_TAGS } from "@/lib/privacyTags";

interface ExportControlsProps {
  chats: ChatMessage[];
  applyMasking: (text: string) => string;
  allChatLength: number;
  maskedWords: MaskedWord[];
}

export const ExportControls = ({ chats, applyMasking, allChatLength, maskedWords }: ExportControlsProps) => {
  const [endpointUrl, setEndpointUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [continueUrl, setContinueUrl] = useState("");
  const prepareExportData = () => {
    // Only the user's own prompts are exported — the assistant's replies are
    // dropped. Masking (█) is applied to whatever the user chose to hide, so any
    // text they did NOT black out remains visible.
    return chats.map(chat => ({
      title: chat.title,
      messages: chat.messages
        .filter(msg => msg.role === 'user')
        .map(msg => ({
          role: msg.role,
          content: applyMasking(msg.content),
          timestamp: msg.timestamp
        }))
    }));
  };
  // Build a privacy-preserving summary of the masking the user performed.
  // NOTE: we deliberately do NOT include the plaintext of the masked words,
  // only their chosen tag and character length, so the anonymized PII is not
  // leaked back to the researchers.
  const prepareMaskingSummary = () => {
    const tagCounts: Record<string, number> = {};
    PRIVACY_TAGS.forEach((t) => (tagCounts[t.id] = 0));
    maskedWords.forEach((w) => {
      tagCounts[w.tag] = (tagCounts[w.tag] ?? 0) + 1;
    });
    return {
      total_masked_terms: maskedWords.length,
      tag_counts: tagCounts,
      masked_terms: maskedWords.map((w) => ({
        tag: w.tag,
        length: w.word.length,
      })),
    };
  };

  const getAllChatLength = () => {
    return allChatLength;
  }

  const handleExport = () => {
    if (chats.length === 0) {
      toast.error("No conversations selected to export");
      return;
    }

    const exportData = prepareExportData();
    const maskingSummary = prepareMaskingSummary();
    const blob = new Blob([JSON.stringify({ conversations: exportData, masking_summary: maskingSummary }, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatgpt-export-filtered-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Export downloaded successfully");
  };

  const handleSubmit = async () => {
    if (chats.length === 0) {
      toast.error("No conversations selected to submit");
      return;
    }

    const endpointUrl = "/submit"

    setIsSubmitting(true);
    console.log("Submitting to endpoint:", endpointUrl);

    try {
      const exportData = prepareExportData();
      const maskingSummary = prepareMaskingSummary();

      var url = new URL(window.location.href);
      var idOne = url.searchParams.get("id_one");
      
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_one: idOne,
          conversations: exportData,
          timestamp: new Date().toISOString(),
          total_conversations: exportData.length,
          total_messages: exportData.reduce((sum, chat) => sum + chat.messages.length, 0),
          all_chat_length: getAllChatLength(),
          masking_summary: maskingSummary
        }),
      });

      const questionnaireAnswered = url.searchParams.get("q")=="f";

      const targetUrl = questionnaireAnswered ?
       "https://app.prolific.com/submissions/complete?cc="+getProlificReturnCode() :
        "https://sosci.sowi.uni-mannheim.de/aiinnews/?returncall=1&id_two="+idOne;

      if (response.ok) {
        toast.success("Data submitted successfully");
        setContinueUrl(targetUrl);
        setIsDone(true);
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("Failed to submit data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-md border-border p-10 text-center shadow-xl">
          <p className="mb-8 text-sm font-semibold tracking-wide text-[#00883A]">
            LMU MÜNCHEN
          </p>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#00883A]/10">
            <CheckCircle2 className="h-9 w-9 text-[#00883A]" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Thank you!</h2>
          <p className="mb-8 text-muted-foreground">
            Your data has been submitted successfully and stored securely. This
            part of the study is now complete.
          </p>
          <Button
            className="w-full bg-[#00883A] hover:bg-[#00742F]"
            size="lg"
            onClick={() => {
              if (continueUrl) window.location.href = continueUrl;
            }}
          >
            Return to the survey
          </Button>
          <p className="mt-6 text-xs text-muted-foreground">
            If you are not redirected automatically, please use the button above.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-6">
       <div className="space-y-4">
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Complete Submission: Transmit Data</h3>
    
<p className="mb-4 text-sm text-muted-foreground">
        Please click here to submit the data and continue in the study.
      </p>      
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={chats.length === 0 || isSubmitting}
          variant="secondary"
        >
          {isSubmitting ? (
            <>
              <Send className="mr-2 h-4 w-4 animate-pulse" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Data
            </>
          )}
        </Button>

        {/* Local testing only: hidden in the production build (npm run build). */}
        {import.meta.env.DEV && (
          <Button
            onClick={handleExport}
            className="w-full"
            disabled={chats.length === 0}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download JSON (test)
          </Button>
        )}
      </div>
    </Card>
  );
};
