import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { LogOut, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentDashboard = ({ user, onLogout }) => {
  const [studentData, setStudentData] = useState(null);
  const [behaviorRecords, setBehaviorRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get student info
      const studentResponse = await axios.get(`${API}/students/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentData(studentResponse.data);

      // Get behavior records
      const behaviorResponse = await axios.get(`${API}/behavior/student/${studentResponse.data.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBehaviorRecords(behaviorResponse.data);
    } catch (error) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBehavior = async (behaviorId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/behavior/${behaviorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حذف السجل بنجاح');
      fetchStudentData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل حذف السجل');
    }
  };

  const positiveRecords = behaviorRecords.filter(r => r.behavior_type === 'positive');
  const negativeRecords = behaviorRecords.filter(r => r.behavior_type === 'negative');
  const totalPositivePoints = positiveRecords.reduce((sum, r) => sum + r.points, 0);
  const totalNegativePoints = negativeRecords.reduce((sum, r) => sum + r.points, 0);

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
                لوحة الطالبة
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
        {/* Student Info Card */}
        <Card className="mb-8 shadow-lg border-2 border-blue-100" data-testid="student-info-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl" data-testid="student-name">{studentData?.name}</CardTitle>
            <CardDescription className="text-lg" data-testid="student-class">الفصل: {studentData?.class_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2" data-testid="total-points">
                {studentData?.total_points || 0}
              </div>
              <p className="text-gray-600" data-testid="points-label">إجمالي النقاط</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200" data-testid="positive-card">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600" data-testid="positive-count">{positiveRecords.length}</div>
                <p className="text-gray-600 mt-1" data-testid="positive-label">سلوكيات إيجابية</p>
                <p className="text-sm text-green-600 font-bold mt-2" data-testid="positive-points">+{totalPositivePoints} نقطة</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200" data-testid="negative-card">
                <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-600" data-testid="negative-count">{negativeRecords.length}</div>
                <p className="text-gray-600 mt-1" data-testid="negative-label">سلوكيات سلبية</p>
                <p className="text-sm text-red-600 font-bold mt-2" data-testid="negative-points">-{totalNegativePoints} نقطة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavior History */}
        <Card className="shadow-lg" data-testid="behavior-history-card">
          <CardHeader>
            <CardTitle data-testid="history-title">سجل السلوكيات</CardTitle>
            <CardDescription data-testid="history-description">جميع السلوكيات المسجلة لك</CardDescription>
          </CardHeader>
          <CardContent>
            {behaviorRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8" data-testid="no-records">لا توجد سجلات بعد</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">النقاط</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {behaviorRecords.map((record, index) => (
                    <TableRow key={record.id} data-testid={`record-row-${index}`}>
                      <TableCell data-testid={`record-date-${index}`}>
                        {new Date(record.date).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell data-testid={`record-type-${index}`}>
                        <Badge 
                          className={record.behavior_type === 'positive' ? 'bg-green-500' : 'bg-red-500'}
                          data-testid={`record-badge-${index}`}
                        >
                          {record.behavior_type === 'positive' ? 'إيجابي' : 'سلبي'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold" data-testid={`record-points-${index}`}>
                        {record.behavior_type === 'positive' ? '+' : '-'}{record.points}
                      </TableCell>
                      <TableCell data-testid={`record-description-${index}`}>{record.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;