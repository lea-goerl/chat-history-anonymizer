import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LifeBuoy, Send, X } from "lucide-react";
import { getProlificReturnCode } from '@/vars';

interface HelpFormProps {
  onClose?: () => void;
}

export const HelpForm = ({ onClose }: HelpFormProps) => {
  const [helpData, setHelpData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleHelpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpointUrl = `${import.meta.env.BASE_URL}submit`;
    setIsSubmitting(true);

    const url = new URL(window.location.href);
    const idOne = url.searchParams.get("id_one");
    // Always send participants back to Prolific and mark the submission complete
    // via the study's completion code (cc). Prolific identifies the participant
    // through their own logged-in session, so id_one is not needed in the URL.
    const targetUrl =
      "https://app.prolific.com/submissions/complete?cc=" + getProlificReturnCode();

    try {
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_one: idOne,
          helpMessage: helpData,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) console.error(`Server responded with ${response.status}`);
    } catch (error) {
      console.error("Error submitting data:", error);
    } finally {
      window.location.href = targetUrl;
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6">
      <Card className="mx-auto max-w-3xl border-primary/20 bg-primary/5 p-6">
        <div className="mb-3 flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Help &amp; Support</h3>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-auto h-8 w-8"
              aria-label="Close help"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          If you run into a problem and can't continue with this submission tool, describe it below
          and we'll help you submit your ChatGPT data.
        </p>

        <div className="mb-5 rounded-md border border-border bg-background p-4 text-sm">
          <p className="font-medium text-foreground">
            Haven't received your ChatGPT export data yet?
          </p>
          <p className="mt-1 text-muted-foreground">
            Please briefly note it below and submit the form. So you can come back once your export
            arrives, bookmark this page:
          </p>
          <a
            href={currentUrl}
            className="mt-2 block break-all font-medium text-primary hover:underline"
          >
            {currentUrl}
          </a>
          <p className="mt-2 text-muted-foreground">Thank you for your contribution!</p>
        </div>

        <form onSubmit={handleHelpSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="issue">Please describe your issue</Label>
            <Textarea
              id="issue"
              value={helpData}
              onChange={(e) => setHelpData(e.target.value)}
              rows={4}
              placeholder="e.g. I haven't received my export email yet…"
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Submitting…" : "Submit and continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
