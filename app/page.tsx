import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, Building2, Activity, Calendar, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Gradient Header Section */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-500 to-cyan-500 px-8 py-10 text-white">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-white/80 mt-1">Welcome back! Here's your recruitment overview.</p>
      </div>

      <div className="p-8 space-y-8 -mt-6">
        {/* Stat Cards with Gradient Accents */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Total Candidates</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">1,234</div>
              <p className="text-xs text-purple-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-white overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-400/20 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-violet-900">Active Jobs</CardTitle>
              <div className="p-2 bg-violet-100 rounded-lg">
                <Briefcase className="h-4 w-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-700">45</div>
              <p className="text-xs text-violet-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +2 new this week
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-white overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-900">Total Companies</CardTitle>
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Building2 className="h-4 w-4 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-700">89</div>
              <p className="text-xs text-cyan-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Cards with Purple/Cyan Accents */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1 border-purple-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
              <CardTitle className="text-purple-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-purple-50/50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Activity className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="ml-3 space-y-1">
                    <p className="text-sm font-medium leading-none text-purple-900">New candidate added</p>
                    <p className="text-xs text-purple-500">Alice Johnson applied for Senior React Developer</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-purple-400">2m ago</div>
                </div>
                <div className="flex items-center p-3 bg-violet-50/50 rounded-lg">
                  <div className="p-2 bg-violet-100 rounded-full">
                    <Activity className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="ml-3 space-y-1">
                    <p className="text-sm font-medium leading-none text-violet-900">Interview scheduled</p>
                    <p className="text-xs text-violet-500">Bob Smith with Tech Corp</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-violet-400">1h ago</div>
                </div>
                <div className="flex items-center p-3 bg-cyan-50/50 rounded-lg">
                  <div className="p-2 bg-cyan-100 rounded-full">
                    <Activity className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="ml-3 space-y-1">
                    <p className="text-sm font-medium leading-none text-cyan-900">Job posted</p>
                    <p className="text-xs text-cyan-500">Full Stack Engineer at Startup Inc</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-cyan-400">3h ago</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 border-cyan-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-violet-50 border-b border-cyan-100">
              <CardTitle className="text-cyan-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-500" />
                Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border-l-4 border-purple-400">
                  <div className="ml-2 space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">Alice Johnson</p>
                    <p className="text-xs text-purple-500">Technical Round • Today, 2:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gradient-to-r from-violet-50 to-transparent rounded-lg border-l-4 border-violet-400">
                  <div className="ml-2 space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">Charlie Brown</p>
                    <p className="text-xs text-violet-500">HR Screen • Tomorrow, 10:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gradient-to-r from-cyan-50 to-transparent rounded-lg border-l-4 border-cyan-400">
                  <div className="ml-2 space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">David Wilson</p>
                    <p className="text-xs text-cyan-500">Final Round • Fri, 11:00 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
