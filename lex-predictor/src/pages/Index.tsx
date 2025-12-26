import { useState } from "react";
import { Upload, Scale, FileText, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const { toast } = useToast();

  // -------------------------
  // Handle file selection
  // -------------------------
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, DOCX, or TXT file",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setConfidence(null);

    toast({
      title: "File uploaded successfully",
      description: `${selectedFile.name} is ready for analysis`,
    });
  };

  // -------------------------
  // Drag-and-drop handler
  // -------------------------
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // -------------------------
  // Predict outcome
  // -------------------------
  const handlePredict = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a case file before predicting",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMsg = data?.error || data?.detail || `Server returned ${response.status}`;
        throw new Error(errorMsg);
      }

      const prediction = data?.result?.prediction;
      let confidenceValue = data?.result?.confidence;

      if (!prediction) throw new Error("Invalid response from server");

      // Convert confidence to percentage if between 0 and 1
      if (confidenceValue !== undefined && confidenceValue !== null) {
        if (confidenceValue <= 1) confidenceValue = Math.round(confidenceValue * 100);
        else confidenceValue = Math.round(confidenceValue);
      }

      setResult(prediction);
      setConfidence(confidenceValue ?? null);

      toast({
        title: "Analysis Complete",
        description: `The appeal is likely to be ${prediction}${
          confidenceValue !== null ? ` (Confidence: ${confidenceValue}%)` : ""
        }`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Could not reach backend server",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="min-h-screen bg-gradient-subtle font-sans">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground py-8 shadow-elegant">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Scale className="w-10 h-10 text-accent" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold">AI Appeal Approval Predictor</h1>
          </div>
          <p className="text-primary-foreground/80 text-lg">
            Advanced Legal Case Analysis System
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {!result ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* How It Works */}
            <Card className="p-8 shadow-elegant border-border">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-3">How It Works</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Upload your case file to predict the likelihood of appeal approval. Our AI analyzes legal documents,
                    precedents, and judicial patterns to provide accurate predictions. Supported formats: PDF, DOC, DOCX, TXT.
                  </p>
                </div>
              </div>
            </Card>

            {/* Upload Section */}
            <Card className="p-8 shadow-elegant border-border">
              <h3 className="text-xl font-serif font-bold text-foreground mb-6">Upload Case File</h3>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-accent transition-all duration-300 bg-card cursor-pointer group"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
                <div className="cursor-pointer flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors duration-300">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                  </div>

                  {file ? (
                    <div className="space-y-2">
                      <p className="text-foreground font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        {file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">Click to replace or drag another file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-foreground font-semibold">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, TXT (max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Predict Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handlePredict}
                  disabled={!file || isAnalyzing}
                  className="bg-gradient-gold text-accent-foreground font-semibold text-lg px-8 py-6 rounded-full shadow-gold-glow hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                      Analyzing Case...
                    </>
                  ) : (
                    <>
                      <Scale className="w-5 h-5" />
                      Predict Outcome
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          // Results Screen
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className={`p-12 shadow-elegant border-2 ${
              result === "approved" ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
            }`}>
              <div className="text-center space-y-6">
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${
                  result === "approved" ? "bg-success/20" : "bg-destructive/20"
                }`}>
                  {result === "approved" ? (
                    <CheckCircle2 className="w-14 h-14 text-success" />
                  ) : (
                    <XCircle className="w-14 h-14 text-destructive" />
                  )}
                </div>

                <div>
                  <h2 className="text-4xl font-serif font-bold mb-3">
                    {result === "approved" ? "Appeal Approved (Likely)" : "Appeal Rejected (Likely)"}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Based on analysis of {file?.name}
                  </p>
                  {confidence !== null && (
                    <p className="text-lg text-accent font-semibold">
                      Confidence: {confidence}%
                    </p>
                  )}
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-start gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <div className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Disclaimer:</strong> This prediction is AI-generated and for informational purposes only.
                      Consult a legal professional before making decisions.
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setConfidence(null);
                  }}
                  variant="outline"
                  className="mt-4 px-8 py-6 text-lg border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                >
                  Analyze Another Case
                </Button>
              </div>
            </Card>

            {/* Case Details Summary */}
            <Card className="p-6 shadow-elegant">
              <h3 className="text-xl font-serif font-bold mb-4">Analysis Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">File Name:</span>
                  <span className="font-semibold">{file?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">File Size:</span>
                  <span className="font-semibold">
                    {file ? (file.size / 1024).toFixed(2) : "0"} KB
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Analysis Date:</span>
                  <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                </div>
                {confidence !== null && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Confidence Level:</span>
                    <span className="font-semibold text-accent">{confidence}%</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-primary text-primary-foreground py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-accent" />
            <p className="text-sm">Powered by Advanced Legal AI Technology</p>
          </div>
          <p className="text-xs text-primary-foreground/60">
            © 2025 AI Appeal Approval Predictor. For informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
