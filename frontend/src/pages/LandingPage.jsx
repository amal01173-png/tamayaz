import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Award, TrendingUp, BarChart3, LogIn } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="max-w-5xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="inline-block p-4 bg-white/20 backdrop-blur rounded-full mb-4 shadow-xl">
                <Award className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-lg" data-testid="hero-title">
              رواد التميز
            </h1>
            <p className="text-xl text-white/90 mb-2 drop-shadow" data-testid="school-name">مدرسة متوسطة غران</p>
            <p className="text-lg text-white/80 mb-8 drop-shadow" data-testid="hero-subtitle">منصة تتبع السلوك المتميز للطالبات</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button 
                onClick={() => navigate('/login')} 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-50 px-10 py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 font-bold"
                data-testid="login-button"
              >
                <LogIn className="ml-2 h-6 w-6" />
                تسجيل الدخول
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 backdrop-blur px-10 py-6 text-xl rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                data-testid="register-button"
              >
                إنشاء حساب
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12" data-testid="features-section">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur hover:scale-105 hover:bg-white" data-testid="feature-card-0">
              <div className="text-green-600 mb-4 flex justify-center">
                <div className="p-4 bg-green-100 rounded-2xl shadow-md">
                  <TrendingUp className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-gray-900">رصد دقيق</h3>
              <p className="text-gray-700 text-center leading-relaxed">تسجيل لحظي للسلوكيات الإيجابية والسلبية مع نظام نقاط واضح</p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur hover:scale-105 hover:bg-white" data-testid="feature-card-1">
              <div className="text-blue-600 mb-4 flex justify-center">
                <div className="p-4 bg-blue-100 rounded-2xl shadow-md">
                  <Award className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-gray-900">لوحة الشرف</h3>
              <p className="text-gray-700 text-center leading-relaxed">تكريم الطالبات المتميزات وتشجيع السلوك الإيجابي المستمر</p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur hover:scale-105 hover:bg-white" data-testid="feature-card-2">
              <div className="text-green-600 mb-4 flex justify-center">
                <div className="p-4 bg-green-100 rounded-2xl shadow-md">
                  <BarChart3 className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-gray-900">تقارير شاملة</h3>
              <p className="text-gray-700 text-center leading-relaxed">إحصائيات تفصيلية لمتابعة تقدم الطالبات وأدائهن السلوكي</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-90" data-testid="footer-text">&copy; 2025 رواد التميز - مدرسة متوسطة غران</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;