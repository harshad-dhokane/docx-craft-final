import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload, Edit, Clock, TrendingUp, Calendar, Activity as ActivityIcon, BarChart3 } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
import { useGeneratedPDFs } from "@/hooks/useGeneratedPDFs";
import { formatDistanceToNow, startOfWeek, startOfMonth } from "date-fns";
import { useMemo } from "react";

const Activity = () => {
  const { activities, isLoading: activitiesLoading } = useActivity();
  const { generatedPDFs, isLoading: pdfsLoading } = useGeneratedPDFs();

  const isLoading = activitiesLoading || pdfsLoading;

  const quickStats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayActivities = activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate >= todayStart;
    }).length;

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate >= weekStart;
    }).length;

    const monthStart = startOfMonth(today);
    const monthActivities = activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate >= monthStart;
    }).length;

    const totalDocuments = generatedPDFs.length;

    return [
      { label: "Today's Activity", value: todayActivities.toString(), icon: Clock, color: "from-blue-500 to-blue-600" },
      { label: "This Week", value: weekActivities.toString(), icon: Calendar, color: "from-green-500 to-green-600" },
      { label: "This Month", value: monthActivities.toString(), icon: TrendingUp, color: "from-purple-500 to-purple-600" },
      { label: "Total Documents", value: totalDocuments.toString(), icon: FileText, color: "from-orange-500 to-orange-600" },
    ];
  }, [activities, generatedPDFs]);

  const getActivityBadge = (action: string) => {
    const badges = {
      download: { label: "Download", variant: "default" as const, color: "bg-green-100 text-green-700" },
      generate: { label: "Generate", variant: "secondary" as const, color: "bg-blue-100 text-blue-700" },
      upload: { label: "Upload", variant: "outline" as const, color: "bg-purple-100 text-purple-700" },
      edit: { label: "Edit", variant: "destructive" as const, color: "bg-orange-100 text-orange-700" },
      create: { label: "Create", variant: "secondary" as const, color: "bg-blue-100 text-blue-700" },
      delete: { label: "Delete", variant: "destructive" as const, color: "bg-red-100 text-red-700" },
    };
    return badges[action as keyof typeof badges] || { label: action, variant: "default" as const, color: "bg-gray-100 text-gray-700" };
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'download':
        return Download;
      case 'generate':
      case 'create':
        return FileText;
      case 'upload':
        return Upload;
      case 'edit':
        return Edit;
      default:
        return ActivityIcon;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'download':
        return "text-green-600 bg-gradient-to-br from-green-50 to-emerald-50";
      case 'generate':
      case 'create':
        return "text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50";
      case 'upload':
        return "text-purple-600 bg-gradient-to-br from-purple-50 to-pink-50";
      case 'edit':
        return "text-orange-600 bg-gradient-to-br from-orange-50 to-amber-50";
      default:
        return "text-gray-600 bg-gradient-to-br from-gray-50 to-slate-50";
    }
  };

  const activityDistribution = useMemo(() => {
    if (activities.length === 0) return [];

    const actionCounts = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = activities.length;

    return Object.entries(actionCounts)
      .map(([action, count]) => ({
        action,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [activities]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Activity Center</h1>
          <p className="text-base sm:text-lg text-gray-600">Track your recent document generation and template activities.</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 sm:p-4 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid - Redesigned Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Recent Activity Feed - Takes more space */}
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                  Recent Activity Feed
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your latest actions and document generations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No activities yet</p>
                    <p className="text-gray-500 text-sm mt-2">Start using the app to see your activity history!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {activities.slice(0, 20).map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.action);
                      return (
                        <div key={activity.id} className="group p-4 sm:p-6 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:shadow-lg">
                          <div className="flex items-start space-x-3 sm:space-x-4">
                            <div className={`p-2 sm:p-3 rounded-xl ${getActivityColor(activity.action)} shadow-md group-hover:shadow-lg transition-all duration-300 flex-shrink-0`}>
                              <ActivityIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200 truncate">
                                    {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} {activity.resource_type || 'item'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                  </p>
                                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                      {Object.entries(activity.metadata).slice(0, 1).map(([key, value]) => 
                                        `${key}: ${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}`
                                      ).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <Badge className={`${getActivityBadge(activity.action).color} border-0 shadow-sm text-xs sm:text-sm flex-shrink-0`}>
                                  {getActivityBadge(activity.action).label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Distribution - Full width on mobile, sidebar on desktop */}
          <div className="xl:col-span-1">
            {activityDistribution.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-600" />
                    Activity Distribution
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Breakdown by action type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activityDistribution.map((item, index) => {
                    const colors = [
                      'from-blue-500 to-blue-600', 
                      'from-green-500 to-green-600', 
                      'from-purple-500 to-purple-600', 
                      'from-orange-500 to-orange-600',
                      'from-pink-500 to-pink-600'
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={item.action} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 bg-gradient-to-r ${color} rounded-full mr-3 shadow-sm`}></div>
                            <span className="text-sm font-medium capitalize text-gray-700">{item.action}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{item.count}</span>
                            <span className="text-sm font-semibold text-gray-900">{item.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-2 bg-gradient-to-r ${color} rounded-full transition-all duration-500`} 
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            
            {/* Summary Stats Card */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm mt-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Activity Summary</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Overview of your usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-2xl font-bold text-blue-900">{activities.length}</p>
                    <p className="text-xs text-blue-700 font-medium">Total Activities</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <p className="text-2xl font-bold text-green-900">{generatedPDFs.length}</p>
                    <p className="text-xs text-green-700 font-medium">Documents</p>
                  </div>
                </div>
                
                {activityDistribution.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Most Common Action:</p>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <span className="text-sm font-semibold text-purple-800 capitalize">{activityDistribution[0].action}</span>
                      <span className="text-sm font-bold text-purple-900">{activityDistribution[0].count} times</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Activity;
