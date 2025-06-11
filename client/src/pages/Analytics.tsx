import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText, Download, Eye, Calendar, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useGeneratedPDFs } from "@/hooks/useGeneratedPDFs";
import { useTemplates } from "@/hooks/useTemplates";
import { useActivity } from "@/hooks/useActivity";
import { useMemo } from "react";

const Analytics = () => {
  const { generatedPDFs } = useGeneratedPDFs();
  const { templates } = useTemplates();
  const { activities } = useActivity();

  const stats = useMemo(() => {
    const totalTemplates = templates.length;
    const totalPDFs = generatedPDFs.length;
    const thisMonthPDFs = generatedPDFs.filter(pdf => {
      const genDate = new Date(pdf.generated_date);
      const thisMonth = new Date();
      return genDate.getMonth() === thisMonth.getMonth() && genDate.getFullYear() === thisMonth.getFullYear();
    }).length;
    const recentActivities = activities.length;

    return [
      {
        title: "Total Templates",
        value: totalTemplates.toString(),
        description: "Active templates",
        icon: FileText,
        trend: "+12%",
        trendUp: true,
        gradient: "from-blue-500 to-blue-600",
      },
      {
        title: "Files Generated",
        value: totalPDFs.toString(),
        description: "This month",
        icon: Download,
        trend: "+23%",
        trendUp: true,
        gradient: "from-green-500 to-green-600",
      },
      {
        title: "Total Activities",
        value: recentActivities.toString(),
        description: "All time actions",
        icon: Eye,
        trend: "+8%",
        trendUp: true,
        gradient: "from-purple-500 to-purple-600",
      },
      {
        title: "Templates Used",
        value: templates.reduce((acc, template) => acc + (template.use_count || 0), 0).toString(),
        description: "Total usage",
        icon: Users,
        trend: "+5%",
        trendUp: true,
        gradient: "from-orange-500 to-orange-600",
      },
    ];
  }, [templates, generatedPDFs, activities]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthlyPDFs = generatedPDFs.filter(pdf => {
        const genDate = new Date(pdf.generated_date);
        return genDate.getMonth() === index && genDate.getFullYear() === currentYear;
      }).length;
      
      const monthlyTemplates = templates.filter(template => {
        const uploadDate = new Date(template.upload_date);
        return uploadDate.getMonth() === index && uploadDate.getFullYear() === currentYear;
      }).length;

      return {
        month,
        pdfs: monthlyPDFs,
        templates: monthlyTemplates
      };
    });
  }, [generatedPDFs, templates]);

  const usageData = useMemo(() => {
    const templateUsage = templates.reduce((acc, template) => {
      const usage = template.use_count || 0;
      if (usage > 0) {
        acc.push({
          name: template.name,
          usage: usage,
          color: '#8B5CF6'
        });
      }
      return acc;
    }, [] as Array<{name: string, usage: number, color: string}>);

    // Sort by usage and take top 5
    templateUsage.sort((a, b) => b.usage - a.usage);
    const topTemplates = templateUsage.slice(0, 5);
    
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
    return topTemplates.map((template, index) => ({
      ...template,
      color: colors[index] || '#8B5CF6'
    }));
  }, [templates]);

  const weeklyActivity = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentWeek = new Date();
    const startOfWeek = new Date(currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1));
    
    return days.map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      
      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.created_at);
        return activityDate.toDateString() === dayDate.toDateString();
      }).length;

      return {
        day,
        activity: dayActivities
      };
    });
  }, [activities]);

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-base sm:text-lg text-gray-600">Track your document generation performance and usage statistics.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 sm:p-4 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className={`flex items-center text-xs sm:text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">{stat.title}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                Monthly Generation Trends
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                File generation and template creation over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                      }} 
                    />
                    <Bar dataKey="pdfs" fill="url(#pdfGradient)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="templates" fill="url(#templateGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="pdfGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                      </linearGradient>
                      <linearGradient id="templateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-600" />
                Weekly Activity
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Daily activity patterns this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activity" 
                      stroke="url(#activityGradient)" 
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {usageData.length > 0 && (
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Template Usage Distribution</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Most popular templates by usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="usage"
                      >
                        {usageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none', 
                          borderRadius: '12px', 
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {usageData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-gray-700 font-medium">{item.name}</span>
                      </div>
                      <span className="text-gray-600 font-semibold">{item.usage}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600" />
                Recent Performance
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Key metrics from your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Active Templates</span>
                  <span className="text-lg font-bold text-blue-900">{templates.length}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">Files Generated</span>
                  <span className="text-lg font-bold text-green-900">{generatedPDFs.length}</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">Recent Activities</span>
                  <span className="text-lg font-bold text-purple-900">{activities.length}</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
