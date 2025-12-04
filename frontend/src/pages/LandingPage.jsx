import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Award, TrendingUp, BarChart3, LogIn } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="max-w-5xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="inline-block p-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-full mb-4">
                <Award className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4" data-testid="hero-title">
              رواد التميز
            </h1>
            <p className="text-xl text-gray-600 mb-2" data-testid="school-name">مدرسة متوسطة غران</p>
            <p className="text-lg text-gray-500 mb-8" data-testid="hero-subtitle">منصة تتبع السلوك المتميز للطالبات</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button 
                onClick={() => navigate('/login')} 
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-10 py-6 text-xl rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                data-testid="login-button"
              >
                <LogIn className="ml-2 h-6 w-6" />
                تسجيل الدخول
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                size="lg"
                variant="outline"
                className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-10 py-6 text-xl rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                data-testid="register-button"
              >
                إنشاء حساب
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12" data-testid="features-section">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200 bg-white/80 backdrop-blur" data-testid="feature-card-0">
              <div className="text-green-600 mb-4 flex justify-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 text-center text-gray-900">تتبع السلوك</h3>
              <p className="text-gray-600 text-center text-sm">نظام شامل لتسجيل السلوكيات الإيجابية والسلبية</p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 bg-white/80 backdrop-blur" data-testid="feature-card-1">
              <div className="text-blue-600 mb-4 flex justify-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Award className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 text-center text-gray-900">نظام النقاط</h3>
              <p className="text-gray-600 text-center text-sm">قياس دقيق للسلوك بنقاط من 1 إلى 10</p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200 bg-white/80 backdrop-blur" data-testid="feature-card-2">
              <div className="text-green-600 mb-4 flex justify-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BarChart3 className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 text-center text-gray-900">تقارير شاملة</h3>
              <p className="text-gray-600 text-center text-sm">متابعة دقيقة لأداء الطالبات وإحصائيات مفصلة</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm" data-testid="footer-text">&copy; 2025 رواد التميز - مدرسة متوسطة غران</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;