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
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);

  // Get available sections based on selected grade
  const getAvailableSections = () => {
    if (grade === '3') {
      return ['أ', 'ب']; // Third grade has only 2 sections
    }
    return ['أ', 'ب', 'ج']; // First and second grades have 3 sections
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!role) {
      toast.error('يرجى اختيار نوع الحساب');
      return;
    }

    // For students, require all three names
    if (role === 'student') {
      if (!firstName || !middleName || !lastName) {
        toast.error('يرجى إدخال الاسم الثلاثي كاملاً');
        return;
      }
      if (!grade || !section) {
        toast.error('يرجى اختيار الصف والفصل');
        return;
      }
      // For students, password must be numbers only
      if (!/^\d+$/.test(password)) {
        toast.error('كلمة المرور للطالبات يجب أن تكون أرقام فقط');
        return;
      }
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أرقام على الأقل');
      return;
    }

    setLoading(true);

    try {
      const fullName = role === 'student' 
        ? `${firstName} ${middleName} ${lastName}`
        : firstName;
      
      const className = role === 'student' ? `${grade}/${section}` : null;
      
      // Prepare registration data
      const registrationData = {
        name: fullName,
        password,
        role,
        class_name: className
      };
      
      // Only include email for non-students
      if (role !== 'student') {
        registrationData.email = email;
      }
        
      const response = await axios.post(`${API}/auth/register`, registrationData);

      const { access_token, user } = response.data;
      
      // Save login credentials for students
      if (user.role === 'student') {
        localStorage.setItem('student_name', fullName);
        localStorage.setItem('student_class', className);
        
        // Show detailed success message with login info
        toast.success(
          <div className="text-right">
            <p className="font-bold mb-2">✅ تم إنشاء الحساب بنجاح!</p>
            <p className="text-sm">📝 احفظي بيانات الدخول:</p>
            <p className="text-sm">• الاسم: {fullName}</p>
            <p className="text-sm">• الصف: {className}</p>
            <p className="text-sm">• كلمة المرور: (التي أدخلتها)</p>
          </div>,
          {
            duration: 8000,
            style: { maxWidth: '400px' }
          }
        );
      } else {
        toast.success('تم إنشاء الحساب بنجاح');
      }
      
      onLogin(user, access_token);
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

              {role === 'student' ? (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 text-center font-bold">
                      أدخلي الاسم الثلاثي كما في نظام نور
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" data-testid="first-name-label">الاسم الأول</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="الاسم"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="text-right"
                        data-testid="first-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName" data-testid="middle-name-label">اسم الأب</Label>
                      <Input
                        id="middleName"
                        type="text"
                        placeholder="الأب"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        required
                        className="text-right"
                        data-testid="middle-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" data-testid="last-name-label">اسم العائلة</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="العائلة"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="text-right"
                        data-testid="last-name-input"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade" data-testid="grade-label">الصف</Label>
                      <Select value={grade} onValueChange={(value) => {
                        setGrade(value);
                        setSection(''); // Reset section when grade changes
                      }}>
                        <SelectTrigger data-testid="grade-select">
                          <SelectValue placeholder="اختر الصف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1" data-testid="grade-1">الأول متوسط</SelectItem>
                          <SelectItem value="2" data-testid="grade-2">الثاني متوسط</SelectItem>
                          <SelectItem value="3" data-testid="grade-3">الثالث متوسط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section" data-testid="section-label">الفصل</Label>
                      <Select value={section} onValueChange={setSection} disabled={!grade}>
                        <SelectTrigger data-testid="section-select">
                          <SelectValue placeholder="اختر الفصل" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableSections().map((sec) => (
                            <SelectItem key={sec} value={sec} data-testid={`section-${sec}`}>
                              {sec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="name" data-testid="name-label">الاسم الكامل</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="أدخل اسمك الكامل"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="text-right"
                    data-testid="name-input"
                  />
                </div>
              )}

              {role !== 'student' && (
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
              )}

              {role === 'student' && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg shadow-sm">
                  <p className="text-sm text-yellow-900 text-center font-bold mb-2">
                    ⚠️ مهم جداً - اقرئي بعناية!
                  </p>
                  <p className="text-xs text-yellow-800 text-center leading-relaxed">
                    سيتم حفظ بياناتك تلقائياً للدخول السريع في المرة القادمة<br/>
                    <strong>احفظي كلمة المرور</strong> في مكان آمن لأنها ستكون مطلوبة دائماً
                  </p>
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
                <p className="text-xs text-gray-500">6 أحرف على الأقل</p>
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