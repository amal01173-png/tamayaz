import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { LogOut, Users, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = ({ user, onLogout }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data);
    } catch (error) {
      toast.error('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" data-testid="loading-state">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-green-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" data-testid="dashboard-title">
                لوحة تحكم الإدارة
              </h1>
              <p className="text-sm text-gray-600" data-testid="user-name">مرحباً، {user.name}</p>
            </div>
            <Button 
              onClick={onLogout} 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50"
              data-testid="logout-button"
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow" data-testid="total-students-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">إجمالي الطالبات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900" data-testid="total-students-count">{statistics?.total_students || 0}</div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow" data-testid="positive-behaviors-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">السلوكيات الإيجابية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600" data-testid="positive-behaviors-count">{statistics?.total_positive_records || 0}</div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-100 hover:shadow-lg transition-shadow" data-testid="negative-behaviors-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">السلوكيات السلبية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600" data-testid="negative-behaviors-count">{statistics?.total_negative_records || 0}</div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow" data-testid="total-activities-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">إجمالي الأنشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600" data-testid="total-activities-count">
                  {(statistics?.total_positive_records || 0) + (statistics?.total_negative_records || 0)}
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Students */}
        <Card className="mb-8 shadow-lg" data-testid="top-students-section">
          <CardHeader>
            <CardTitle className="text-xl" data-testid="top-students-title">الطالبات المتميزات</CardTitle>
            <CardDescription data-testid="top-students-description">أفضل 5 طالبات حسب النقاط</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الفصل</TableHead>
                  <TableHead className="text-right">إجمالي النقاط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics?.top_students?.map((student, index) => (
                  <TableRow key={student.id} data-testid={`top-student-row-${index}`}>
                    <TableCell className="font-medium" data-testid={`student-name-${index}`}>{student.name}</TableCell>
                    <TableCell data-testid={`student-class-${index}`}>{student.class_name}</TableCell>
                    <TableCell data-testid={`student-points-${index}`}>
                      <Badge 
                        className="bg-gradient-to-r from-green-600 to-blue-600 text-white"
                        data-testid={`student-badge-${index}`}
                      >
                        {student.total_points} نقطة
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-lg" data-testid="recent-activities-section">
          <CardHeader>
            <CardTitle className="text-xl" data-testid="recent-activities-title">آخر الأنشطة</CardTitle>
            <CardDescription data-testid="recent-activities-description">أحدث 10 سجلات سلوكية</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نوع السلوك</TableHead>
                  <TableHead className="text-right">النقاط</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics?.recent_activities?.map((activity, index) => (
                  <TableRow key={activity.id} data-testid={`activity-row-${index}`}>
                    <TableCell data-testid={`activity-type-${index}`}>
                      <Badge 
                        className={activity.behavior_type === 'positive' ? 'bg-green-500' : 'bg-red-500'}
                        data-testid={`activity-badge-${index}`}
                      >
                        {activity.behavior_type === 'positive' ? 'إيجابي' : 'سلبي'}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`activity-points-${index}`}>{activity.points}</TableCell>
                    <TableCell data-testid={`activity-description-${index}`}>{activity.description}</TableCell>
                    <TableCell data-testid={`activity-date-${index}`}>
                      {new Date(activity.date).toLocaleDateString('ar-SA')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;