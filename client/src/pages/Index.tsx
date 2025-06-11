
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Download, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const Index = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (user) {
      setLocation("/dashboard");
    } else {
      // Navigate to protected route which will show auth page
      setLocation("/dashboard");
    }
  };

  const handleSignIn = () => {
    setLocation("/dashboard"); // This will redirect to auth page if not logged in
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">DocCraft PDF</span>
        </div>
        <div className="space-x-4">
          {user ? (
            <Button onClick={() => setLocation("/dashboard")}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button onClick={handleGetStarted}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Transform DOCX Templates into
          <span className="text-blue-600 block">Professional PDFs</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload your .docx templates with placeholders, fill them with dynamic data, 
          and generate beautiful PDFs instantly. Perfect for invoices, contracts, reports, and more.
        </p>
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          onClick={handleGetStarted}
        >
          Get Started Free
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>1. Upload Template</CardTitle>
              <CardDescription>
                Upload your .docx file with placeholders like {"{"}{"{"} CustomerName {"}"}{"}"} or {"{"}{"{"} InvoiceDate {"}"}{"}"}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>2. Fill Data</CardTitle>
              <CardDescription>
                Our system automatically detects placeholders and creates a form for you to input your data
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>3. Generate PDF</CardTitle>
              <CardDescription>
                Get your professional PDF with all formatting preserved, ready for sharing or printing
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose DocCraft PDF?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">Generate PDFs in seconds, not minutes</p>
            </div>
            <div className="text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Format Preserved</h3>
              <p className="text-gray-600 text-sm">Keep all your original formatting intact</p>
            </div>
            <div className="text-center">
              <Upload className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Easy Upload</h3>
              <p className="text-gray-600 text-sm">Simple drag-and-drop interface</p>
            </div>
            <div className="text-center">
              <Download className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Secure Storage</h3>
              <p className="text-gray-600 text-sm">Your files are safely stored and organized</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to Start Creating?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of users who trust DocCraft PDF for their document needs
        </p>
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          onClick={handleGetStarted}
        >
          Start Creating PDFs Now
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">DocCraft PDF</span>
          </div>
          <p className="text-gray-400">
            Transform your documents with ease and precision
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
