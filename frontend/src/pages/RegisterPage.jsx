import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, UserPlus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RegisterPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!role) {
      toast.error('يرجى اختيار نوع الحساب');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (role === 'student' && !className) {
      toast.error('يرجى إدخال الفصل للطالبة');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        name,
        email,
        password,
        role,
        class_name: role === 'student' ? className : null
      });

      const { access_token, user } = response.data;
      onLogin(user, access_token);
      toast.success('تم إنشاء الحساب بنجاح');
      navigate(`/${user.role}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ أثناء إنشاء الحساب');
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2" data-testid="register-title">
            رواد التميز
          </h1>
          <p className="text-gray-600" data-testid="school-name-register">مدرسة متوسطة غران</p>
        </div>

        <Card className="shadow-2xl border-2" data-testid="register-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold" data-testid="card-title">
              <UserPlus className="inline-block ml-2 h-6 w-6" />
              إنشاء حساب جديد
            </CardTitle>
            <CardDescription data-testid="card-description">أدخل بياناتك لإنشاء حساب جديد</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" data-testid="name-label">الاسم الكامل</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-right"
                  data-testid="name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" data-testid="email-label">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-right"
                  data-testid="email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" data-testid="role-label">نوع الحساب</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger data-testid="role-select">
                    <SelectValue placeholder="اختر نوع الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" data-testid="role-admin">مديرة</SelectItem>
                    <SelectItem value="teacher" data-testid="role-teacher">معلمة</SelectItem>
                    <SelectItem value="student" data-testid="role-student">طالبة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="className" data-testid="class-label">الفصل</Label>
                  <Input
                    id="className"
                    type="text"
                    placeholder="مثال: 1/أ"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                    className="text-right"
                    data-testid="class-input"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" data-testid="password-label">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="text-right"
                  data-testid="password-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" data-testid="confirm-password-label">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="text-right"
                  data-testid="confirm-password-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
                data-testid="register-submit-button"
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-gray-600" data-testid="login-link-text">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-green-600 hover:text-green-700 font-bold hover:underline"
                    data-testid="login-link"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;