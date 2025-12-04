import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
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
            <CardTitle className="text-2xl font-bold" data-testid="card-title">تسجيل الدخول</CardTitle>
            <CardDescription data-testid="card-description">أدخل بريدك الإلكتروني وكلمة المرور للدخول</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;