import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { ArrowRight, LogIn } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Staff login state
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  
  // Student login state
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Load saved student credentials
  React.useEffect(() => {
    const savedName = localStorage.getItem('student_name');
    const savedClass = localStorage.getItem('student_class');
    if (savedName) setStudentName(savedName);
    if (savedClass) setStudentClass(savedClass);
  }, []);

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username: staffUsername,
        password: staffPassword
      });

      const { access_token, user } = response.data;
      onLogin(user, access_token);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(`/${user.role}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username: studentName,
        password: studentPassword,
        class_name: studentClass
      });

      const { access_token, user } = response.data;
      onLogin(user, access_token);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(`/${user.role}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="mb-4 text-gray-600 hover:text-gray-900"
            data-testid="back-button"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2" data-testid="login-title">
            رواد التميز
          </h1>
          <p className="text-gray-600" data-testid="school-name-login">مدرسة متوسطة غران</p>
        </div>

        <Card className="shadow-2xl border-2" data-testid="login-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold" data-testid="card-title">
              <LogIn className="inline-block ml-2 h-6 w-6" />
              تسجيل الدخول
            </CardTitle>
            <CardDescription data-testid="card-description">اختر نوع الحساب للدخول</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="staff" className="w-full" data-testid="login-tabs">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="staff" data-testid="staff-tab">معلمة / إدارة</TabsTrigger>
                <TabsTrigger value="student" data-testid="student-tab">طالبة</TabsTrigger>
              </TabsList>
              
              <TabsContent value="staff">
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-username" data-testid="staff-username-label">اسم المستخدم</Label>
                    <Input
                      id="staff-username"
                      type="text"
                      placeholder="أدخل اسمك"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      required
                      className="text-right"
                      data-testid="staff-username-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password" data-testid="staff-password-label">كلمة المرور</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      placeholder="••••••••"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      required
                      className="text-right"
                      data-testid="staff-password-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                    data-testid="staff-login-button"
                  >
                    {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-name" data-testid="student-name-label">الاسم</Label>
                    <Input
                      id="student-name"
                      type="text"
                      placeholder="أدخل اسمك"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      className="text-right"
                      data-testid="student-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-class" data-testid="student-class-label">الصف والفصل</Label>
                    <Input
                      id="student-class"
                      type="text"
                      placeholder="مثال: 1/أ"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      required
                      className="text-right"
                      data-testid="student-class-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password" data-testid="student-password-label">كلمة المرور</Label>
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                      className="text-right"
                      data-testid="student-password-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                    data-testid="student-login-button"
                  >
                    {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="text-center pt-4 border-t mt-6">
              <p className="text-gray-600" data-testid="register-link-text">
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-green-600 hover:text-green-700 font-bold hover:underline"
                  data-testid="register-link"
                >
                  إنشاء حساب جديد
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;