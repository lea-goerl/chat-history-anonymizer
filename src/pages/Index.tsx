import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ChatViewer } from "@/components/ChatViewer";
import { MaskingControls } from "@/components/MaskingControls";
import { ExportControls } from "@/components/ExportControls";
import { Button } from "@/components/ui/button";
import { HelpForm } from "@/components/HelpForm";
import { FileText, HelpCircle } from "lucide-react";
import JSZip from "jszip";
import { MaskedWord, PrivacyTagId, DEFAULT_TAG_ID } from "@/lib/privacyTags";
import { escapeRegExp } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>;
  selected: boolean;
}

const Index = () => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [maskedWords, setMaskedWords] = useState<MaskedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpVisible, setHelpvisible] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      // Validate file is actually a ZIP
      if (!file.name.endsWith('.zip')) {
        throw new Error('Please upload a ZIP file');
      }

      console.log('Processing ZIP file:', file.name, 'Size:', file.size, 'bytes');
      
      const zip = new JSZip();
      const contents = await zip.loadAsync(file).catch(err => {
        console.error('ZIP load error:', err);
        throw new Error('Invalid or corrupted ZIP file. Please re-download your ChatGPT export and try again.');
      });
      
      const chatFiles: ChatMessage[] = [];
      let fileIndex = 0;

      console.log('ZIP loaded successfully. Found', Object.keys(contents.files).length, 'files');

      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (filename.endsWith('.json') && !zipEntry.dir) {
          console.log('Processing JSON file:', filename);
          const content = await zipEntry.async('string');
          try {
            const data = JSON.parse(content);
            
            // Helper function to extract content from various formats
            const extractContent = (node: any): string | null => {
              if (!node.message?.content) return null;
              
              const content = node.message.content;
              
              // Format 1: content.parts array (most common)
              if (content.parts && Array.isArray(content.parts) && content.parts.length > 0) {
                return typeof content.parts[0] === 'string' ? content.parts[0] : JSON.stringify(content.parts[0]);
              }
              
              // Format 2: content as direct string
              if (typeof content === 'string') {
                return content;
              }
              
              // Format 3: content.text
              if (content.text && typeof content.text === 'string') {
                return content.text;
              }
              
              // Format 4: content.content_type with text
              if (content.content_type === 'text' && content.text) {
                return content.text;
              }
              
              return null;
            };
            
            // Helper function to process messages from mapping
            const processMapping = (mapping: any): Array<{role: string; content: string; timestamp?: string}> => {
              if (!mapping || typeof mapping !== 'object') return [];
              
              const messages: Array<{role: string; content: string; timestamp?: string}> = [];
              
              Object.values(mapping).forEach((node: any) => {
                const content = extractContent(node);
                if (content && node.message?.author?.role) {
                  messages.push({
                    role: node.message.author.role,
                    content: content,
                    timestamp: node.message.create_time
                  });
                }
              });
              
              return messages;
            };
            
            // Handle ChatGPT export format
            if (Array.isArray(data)) {
              // Array of conversations
              data.forEach((chat, index) => {
                const messages = chat.mapping ? processMapping(chat.mapping) : [];
                if (messages.length > 0) {
                  chatFiles.push({
                    id: `${fileIndex}-${index}`,
                    title: chat.title || `Conversation ${fileIndex + 1}-${index + 1}`,
                    messages: messages,
                    selected: true
                  });
                }
              });
            } else if (data.title && data.mapping) {
              // Single conversation format
              const messages = processMapping(data.mapping);
              if (messages.length > 0) {
                chatFiles.push({
                  id: `${fileIndex}`,
                  title: data.title || `Conversation ${fileIndex + 1}`,
                  messages: messages,
                  selected: true
                });
              }
            } else if (data.messages && Array.isArray(data.messages)) {
              // Alternative format: direct messages array
              const messages = data.messages
                .filter((msg: any) => msg.role && msg.content)
                .map((msg: any) => ({
                  role: msg.role,
                  content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                  timestamp: msg.timestamp || msg.create_time
                }));
              
              if (messages.length > 0) {
                chatFiles.push({
                  id: `${fileIndex}`,
                  title: data.title || `Conversation ${fileIndex + 1}`,
                  messages: messages,
                  selected: true
                });
              }
            }
            
            fileIndex++;
          } catch (error) {
            console.error(`Error parsing ${filename}:`, error);
            console.error('File content preview:', content.substring(0, 200));
          }
        }
      }

      console.log('Successfully processed', chatFiles.length, 'conversations');
      
      if (chatFiles.length === 0) {
        throw new Error('No ChatGPT conversations found in ZIP file. Please make sure you exported your data correctly from ChatGPT.');
      }

      setChats(chatFiles);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error processing ZIP file:', errorMessage, error);
      
      // Show error to user
      alert(`Upload failed: ${errorMessage}\n\nPlease check the console for more details or contact support if the issue persists.`);

      const endpointUrl = `${import.meta.env.BASE_URL}submit`
      var url = new URL(window.location.href);
      var idOne = url.searchParams.get("id_one");
      
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_one: idOne,
          helpMessage: errorMessage,
          errorDetails: error instanceof Error ? error.stack : String(error),
          fileName: file.name,
          fileSize: file.size,
          timestamp: new Date().toISOString(),
       //   total_conversations: exportData.length,
        //  total_messages: exportData.reduce((sum, chat) => sum + chat.messages.length, 0)
        }),
      });

      if (response.ok) {
        console.log("Help data submitted.");
      } else {
        console.error(`Server responded with ${response.status}`);
        
      }

    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = (id: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, selected: !chat.selected } : chat
    ));
  };

  const toggleAll = (selected: boolean) => {
    setChats(prev => prev.map(chat => ({ ...chat, selected })));
  };

  const addMaskedWord = (word: string, tag: PrivacyTagId = DEFAULT_TAG_ID) => {
    const normalized = word.trim().toLowerCase();
    if (!normalized) return;
    setMaskedWords(prev => {
      const existing = prev.find(w => w.word === normalized);
      if (existing) {
        // Word already masked: update its tag to the newly chosen one.
        return prev.map(w => (w.word === normalized ? { ...w, tag } : w));
      }
      return [...prev, { word: normalized, tag }];
    });
  };

  const setMaskedWordTag = (word: string, tag: PrivacyTagId) => {
    setMaskedWords(prev => prev.map(w => (w.word === word ? { ...w, tag } : w)));
  };

  const removeMaskedWord = (word: string) => {
    setMaskedWords(prev => prev.filter(w => w.word !== word));
  };

  const applyMasking = (text: string): string => {
    let masked = text;
    maskedWords.forEach(({ word }) => {
      const regex = new RegExp(escapeRegExp(word), 'gi');
      masked = masked.replace(regex, '█'.repeat(word.length));
    });
    return masked;
  };

  const openHelp = () => {
    setHelpvisible(true);
    // Wait for the HelpForm to render, then scroll to it.
    setTimeout(() => {
      document.getElementById("help-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const reset = () => {
    setChats([]);
    setMaskedWords([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">ChatGPT Chat Submission</h1>
              <p className="text-sm text-muted-foreground">View, filter, and anonymize your chat history for the data donation</p>
            </div>
          </div>
          <Button variant="outline" onClick={openHelp}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Button>
        </div>
      </header>

      {isHelpVisible ? <div id="help-section"><HelpForm onClose={() => setHelpvisible(false)} /></div> : <div></div>}
   
      <main className="container mx-auto px-4 py-8">
        {chats.length === 0 ? (
          <div>
          <FileUpload
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            onNeedHelp={openHelp}
          />
        </div>          
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {chats.length} conversation{chats.length !== 1 ? 's' : ''} loaded
                </h2>
                <p className="text-sm text-muted-foreground">
                  {chats.filter(c => c.selected).length} selected
                </p>
              </div>
              <Button variant="outline" onClick={reset}>
                Load Different File
              </Button> 
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChatViewer 
                  chats={chats} 
                  onToggleChat={toggleChat}
                  onToggleAll={toggleAll}
                  applyMasking={applyMasking}
                  onAddMaskedWord={addMaskedWord}
                />
              </div>
              
              
              <div className="space-y-6">
                <MaskingControls
                  maskedWords={maskedWords}
                  onAddWord={addMaskedWord}
                  onRemoveWord={removeMaskedWord}
                  onChangeTag={setMaskedWordTag}
                />
              
                <ExportControls 
                  chats={chats.filter(c => c.selected)}
                  allChatLength={chats.length}
                  applyMasking={applyMasking}
                  maskedWords={maskedWords}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
