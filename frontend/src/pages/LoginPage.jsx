import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowRight, LogIn } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
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
            <CardDescription data-testid="card-description">أدخل اسمك وكلمة المرور للدخول</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" data-testid="username-label">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسمك"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-right"
                  data-testid="username-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" data-testid="password-label">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-right"
                  data-testid="password-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>

              <div className="text-center pt-4 border-t">
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;