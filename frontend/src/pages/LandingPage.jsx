import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Award, TrendingUp, Users, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Award className="w-12 h-12" />,
      title: 'تتبع السلوك المتميز',
      description: 'نظام شامل لتسجيل ومتابعة سلوكيات الطالبات الإيجابية والسلبية'
    },
    {
      icon: <TrendingUp className="w-12 h-12" />,
      title: 'نظام نقاط عادل',
      description: 'نظام نقاط من 1 إلى 10 لقياس السلوك بدقة وشفافية'
    },
    {
      icon: <BarChart3 className="w-12 h-12" />,
      title: 'تقارير مفصلة',
      description: 'تقارير دقيقة وإحصائيات شاملة لمتابعة تقدم الطالبات'
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: 'سهولة الاستخدام',
      description: 'واجهة بسيطة وسهلة لجميع المستخدمين من معلمات وطالبات'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" data-testid="platform-title">
              رواد التميز
            </h1>
            <p className="text-sm text-gray-600 mt-1" data-testid="school-name">مدرسة متوسطة غران</p>
          </div>
          <Button 
            onClick={() => navigate('/login')} 
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            data-testid="header-login-button"
          >
            تسجيل الدخول
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight" data-testid="hero-title">
            منصة إلكترونية لتعزيز
            <span className="block mt-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              السلوك الإيجابي
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="hero-description">
            نظام متكامل لتسجيل ومتابعة سلوكيات الطالبات، يساعد على بناء بيئة تعليمية إيجابية ومحفزة
          </p>
          <Button 
            onClick={() => navigate('/login')} 
            size="lg" 
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-12 py-7 text-xl rounded-full shadow-2xl hover:shadow-green-200 transition-all duration-300 hover:scale-105"
            data-testid="hero-cta-button"
          >
            ابدأ الآن
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20" data-testid="features-section">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-4" data-testid="features-title">مزايا المنصة</h3>
          <p className="text-gray-600 text-lg" data-testid="features-subtitle">كل ما تحتاجه لإدارة السلوك الطلابي بكفاءة</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-200 hover:scale-105 bg-white"
              data-testid={`feature-card-${index}`}
            >
              <div className="text-green-600 mb-4" data-testid={`feature-icon-${index}`}>{feature.icon}</div>
              <h4 className="text-xl font-bold mb-3 text-gray-900" data-testid={`feature-title-${index}`}>{feature.title}</h4>
              <p className="text-gray-600" data-testid={`feature-description-${index}`}>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 p-12 text-center text-white shadow-2xl" data-testid="cta-section">
          <h3 className="text-4xl font-bold mb-4" data-testid="cta-title">انضم إلى منصة رواد التميز</h3>
          <p className="text-xl mb-8 opacity-90" data-testid="cta-description">ابدأ رحلتك نحو بيئة تعليمية أفضل</p>
          <Button 
            onClick={() => navigate('/login')} 
            size="lg" 
            variant="secondary"
            className="bg-white text-green-600 hover:bg-gray-100 px-12 py-7 text-xl rounded-full shadow-xl hover:scale-105 transition-all duration-300 font-bold"
            data-testid="cta-button"
          >
            تسجيل الدخول الآن
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p data-testid="footer-text">&copy; 2025 رواد التميز - مدرسة متوسطة غران. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;