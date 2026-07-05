import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, X, EyeOff, Tag } from "lucide-react";
import {
  MaskedWord,
  PrivacyTagId,
  PRIVACY_TAGS,
  getPrivacyTag,
} from "@/lib/privacyTags";

interface MaskingControlsProps {
  maskedWords: MaskedWord[];
  onAddWord: (word: string, tag: PrivacyTagId) => void;
  onRemoveWord: (word: string) => void;
  onChangeTag: (word: string, tag: PrivacyTagId) => void;
}

export const MaskingControls = ({
  maskedWords,
  onAddWord,
  onRemoveWord,
  onChangeTag,
}: MaskingControlsProps) => {
  const [newWord, setNewWord] = useState("");
  // Empty string = no tag chosen yet. A tag is mandatory before a word can be added.
  const [newTag, setNewTag] = useState<PrivacyTagId | "">("");

  const canAdd = newWord.trim().length > 0 && newTag !== "";

  const handleAdd = () => {
    if (canAdd) {
      onAddWord(newWord.trim(), newTag as PrivacyTagId);
      setNewWord("");
      setNewTag("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <EyeOff className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Word Masking</h3>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Add words or phrases to mask in your conversations. They'll be replaced
        with █ characters. Pick a privacy tag so you can keep track of what kind
        of information each entry is.
      </p>

      <div className="mb-3 flex gap-2">
        <Input
          placeholder="Enter word to mask..."
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleAdd} size="icon" disabled={!canAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4">
        <Select value={newTag} onValueChange={(v) => setNewTag(v as PrivacyTagId)}>
          <SelectTrigger
            className={`w-full ${newTag === "" ? "border-primary/60 ring-1 ring-primary/30" : ""}`}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Choose a privacy tag (required)" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PRIVACY_TAGS.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${tag.dotClass}`} />
                  {tag.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {newTag === "" ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Pick a privacy tag to enable masking.
          </p>
        ) : (
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-muted-foreground">
              {getPrivacyTag(newTag).question}
            </p>
            <p className="text-xs italic text-muted-foreground/80">
              {getPrivacyTag(newTag).example}
            </p>
          </div>
        )}
      </div>

      {maskedWords.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">
            {maskedWords.length} word{maskedWords.length !== 1 ? "s" : ""} masked
          </p>

          {PRIVACY_TAGS.filter((tag) =>
            maskedWords.some((w) => w.tag === tag.id)
          ).map((tag) => (
            <div key={tag.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${tag.dotClass}`} />
                <span className="text-xs font-semibold text-foreground">
                  {tag.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {maskedWords
                  .filter((w) => w.tag === tag.id)
                  .map((w) => (
                    <Badge
                      key={w.word}
                      variant="outline"
                      className={`gap-1 ${tag.badgeClass}`}
                    >
                      {w.word}
                      {/* Re-tag this entry */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="ml-0.5 rounded-full hover:bg-background/50"
                            title="Change tag"
                          >
                            <Tag className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-72">
                          <DropdownMenuLabel>Change privacy tag</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {PRIVACY_TAGS.map((t) => (
                            <DropdownMenuItem
                              key={t.id}
                              onSelect={() => onChangeTag(w.word, t.id)}
                              className="flex items-center gap-2"
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${t.dotClass}`}
                              />
                              {t.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <button
                        onClick={() => onRemoveWord(w.word)}
                        className="ml-0.5 rounded-full hover:bg-background/50"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">No words masked yet</p>
        </div>
      )}
    </Card>
  );
};
