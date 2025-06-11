
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Edit, Download, CheckCircle, FileSpreadsheet } from "lucide-react";

const UserGuide = () => {
  const steps = [
    {
      icon: Upload,
      title: "1. Upload Your Template",
      description: "Start by uploading a Word document (.docx) or Excel file (.xlsx) that will serve as your template.",
      details: [
        "Click the 'Upload Template' button on the Dashboard or Templates page",
        "Select a .docx or .xlsx file from your computer",
        "Make sure your document contains placeholders in {{placeholder}} format",
        "Example: {{name}}, {{date}}, {{company}}, {{address}}"
      ],
      color: "bg-blue-500"
    },
    {
      icon: Edit,
      title: "2. Add Placeholders",
      description: "Use double curly braces to mark fields that will be replaced with dynamic content.",
      details: [
        "Use the format {{field_name}} for placeholders",
        "Examples: {{customer_name}}, {{invoice_date}}, {{total_amount}}",
        "Placeholders are case-sensitive",
        "Use descriptive names for better organization"
      ],
      color: "bg-green-500"
    },
    {
      icon: FileText,
      title: "3. Generate Documents",
      description: "Fill in the placeholder values and generate your customized documents.",
      details: [
        "Click 'Generate' on any template",
        "Fill in all the required fields",
        "Preview your document before generating",
        "Download the generated file"
      ],
      color: "bg-purple-500"
    },
    {
      icon: Download,
      title: "4. Manage Generated Files",
      description: "Access and download all your generated documents from the Generated Documents page.",
      details: [
        "View all your generated documents",
        "Download files anytime",
        "See generation history and metadata",
        "Delete old files to save storage"
      ],
      color: "bg-orange-500"
    }
  ];

  const tips = [
    {
      title: "Best Practices",
      items: [
        "Use clear, descriptive placeholder names",
        "Test your template with sample data first",
        "Keep template file sizes reasonable",
        "Use consistent formatting in your documents"
      ]
    },
    {
      title: "Supported Formats",
      items: [
        "Input: Microsoft Word (.docx) and Excel (.xlsx) files",
        "Output: PDF documents, Word documents, and Excel files",
        "Placeholders: {{field_name}} format",
        "Text, tables, and basic formatting supported"
      ]
    },
    {
      title: "Document Types",
      items: [
        "Word documents: Generate as PDF or keep as Word format",
        "Excel files: Generate with replaced placeholders",
        "Both formats support {{placeholder}} syntax",
        "Automatic placeholder detection and validation"
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">User Guide</h1>
        <p className="text-base sm:text-lg text-gray-600 mt-2">Learn how to create and use templates effectively</p>
      </div>

      {/* Getting Started Steps */}
      <div className="space-y-6 lg:space-y-8 mb-8 lg:mb-12">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6">Getting Started</h2>
          <div className="grid gap-4 lg:gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 ${step.color} rounded-lg shadow-lg`}>
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">{step.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Tips and Best Practices */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6">Tips & Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {tips.map((tip, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <span>{tip.title}</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                    {tip.items.length} tips
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tip.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Example Templates */}
      <div className="mt-8 lg:mt-12 space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6">Example Templates</h2>
        
        {/* Word Document Example */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Sample Invoice Template (Word)</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Here's an example of how to structure placeholders in your Word document:</p>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 border-2 border-dashed border-gray-300">
              <div className="space-y-4 font-mono text-sm">
                <div className="text-gray-800">
                  <strong>Invoice #{'{{invoice_number}}'}</strong>
                </div>
                <div className="text-gray-600">
                  Date: {'{{invoice_date}}'}
                  <br/>
                  Due Date: {'{{due_date}}'}
                </div>
                <div className="text-gray-600">
                  <strong>Bill To:</strong>
                  <br/>
                  {'{{customer_name}}'}
                  <br/>
                  {'{{customer_address}}'}
                  <br/>
                  {'{{customer_city}}'}, {'{{customer_state}}'} {'{{customer_zip}}'}
                </div>
                <div className="text-gray-600">
                  <strong>Description:</strong> {'{{service_description}}'}
                  <br/>
                  <strong>Amount:</strong> ${'{{total_amount}}'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Excel Example */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span>Sample Expense Report Template (Excel)</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Here's an example of how to use placeholders in Excel cells:</p>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 border-2 border-dashed border-gray-300">
              <div className="space-y-2 font-mono text-sm">
                <div className="grid grid-cols-3 gap-4 text-gray-800 font-bold border-b pb-2">
                  <span>A1: Employee Name</span>
                  <span>B1: Department</span>
                  <span>C1: Date</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-gray-600">
                  <span>A2: {'{{employee_name}}'}</span>
                  <span>B2: {'{{department}}'}</span>
                  <span>C2: {'{{report_date}}'}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-gray-600 mt-4 pt-2 border-t">
                  <span>A4: Total Amount</span>
                  <span>B4: {'{{total_amount}}'}</span>
                  <span>C4: {'{{currency}}'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-600 mt-4">
          When you generate documents from these templates, all {'{{placeholder}}'} fields will be replaced with the values you provide.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default UserGuide;
