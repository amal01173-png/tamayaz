import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { LogOut, Plus, Search, Upload, FileSpreadsheet, Trash2, Award } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeacherDashboard = ({ user, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [behaviorType, setBehaviorType] = useState('positive');
  const [points, setPoints] = useState(5);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentSection, setNewStudentSection] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [topStudentsByClass, setTopStudentsByClass] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
    fetchTopStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      toast.error('فشل تحميل قائمة الطالبات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBehavior = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error('يرجى اختيار طالبة');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/behavior`, {
        student_id: selectedStudent,
        behavior_type: behaviorType,
        points: parseInt(points),
        description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('تم تسجيل السلوك بنجاح');
      setIsDialogOpen(false);
      setSelectedStudent(null);
      setDescription('');
      setPoints(5);
      setBehaviorType('positive');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل تسجيل السلوك');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudentGrade || !newStudentSection) {
      toast.error('يرجى اختيار الصف والفصل');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const className = `${newStudentGrade}/${newStudentSection}`;
      await axios.post(`${API}/students`, {
        name: newStudentName,
        class_name: className
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('تمت إضافة الطالبة بنجاح');
      setIsAddStudentOpen(false);
      setNewStudentName('');
      setNewStudentGrade('');
      setNewStudentSection('');
      fetchStudents();
    } catch (error) {
      toast.error('فشل إضافة الطالبة');
    }
  };
  
  // Get available sections based on selected grade
  const getAvailableSections = () => {
    if (newStudentGrade === '3') {
      return ['أ', 'ب']; // Third grade has only 2 sections
    }
    return ['أ', 'ب', 'ج']; // First and second grades have 3 sections
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('يجب أن يكون الملف من نوع Excel (.xlsx أو .xls)');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleImportStudents = async () => {
    if (!uploadFile) {
      toast.error('يرجى اختيار ملف Excel');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/students/import`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;
      toast.success(`تمت إضافة ${result.added_count} طالبة بنجاح${result.skipped_count > 0 ? `. تم تجاوز ${result.skipped_count} سجل` : ''}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('Errors:', result.errors);
      }

      setIsImportOpen(false);
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل استيراد الطالبات');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/template_students.xlsx';
    link.download = 'قالب_الطالبات.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                لوحة تحكم المعلمة
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
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن طالبة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
                data-testid="search-input"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid="import-students-button"
                >
                  <Upload className="ml-2 h-4 w-4" />
                  استيراد من Excel
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="import-dialog">
                <DialogHeader>
                  <DialogTitle data-testid="import-dialog-title">استيراد الطالبات من Excel</DialogTitle>
                  <DialogDescription data-testid="import-dialog-description">
                    قم برفع ملف Excel يحتوي على بيانات الطالبات
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">تنسيق الملف المطلوب:</h4>
                    <p className="text-sm text-blue-800 mb-2">يجب أن يحتوي الملف على عمود واحد فقط:</p>
                    <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                      <li><strong>الاسم</strong> (الاسم الثلاثي كامل)</li>
                    </ul>
                    <p className="text-xs text-blue-700 mt-2">ملاحظة: سيتم إنشاء بريد إلكتروني وكلمة مرور تلقائياً</p>
                  </div>
                  <div className="space-y-2">
                    <Label>اختر ملف Excel</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      data-testid="file-input"
                    />
                    {uploadFile && (
                      <p className="text-sm text-green-600" data-testid="selected-file">
                        <FileSpreadsheet className="inline h-4 w-4 ml-1" />
                        {uploadFile.name}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={handleImportStudents}
                    disabled={!uploadFile || uploading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    data-testid="submit-import"
                  >
                    {uploading ? 'جاري الاستيراد...' : 'استيراد الطالبات'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="add-student-button"
                >
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة طالبة
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="add-student-dialog">
                <DialogHeader>
                  <DialogTitle data-testid="add-student-dialog-title">إضافة طالبة جديدة</DialogTitle>
                  <DialogDescription data-testid="add-student-dialog-description">
                    أدخل بيانات الطالبة الجديدة
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">اسم الطالبة (الاسم الثلاثي)</Label>
                    <Input
                      id="studentName"
                      placeholder="مثال: فاطمة محمد الأحمد"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      required
                      data-testid="student-name-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentGrade">الصف</Label>
                      <Select value={newStudentGrade} onValueChange={(value) => {
                        setNewStudentGrade(value);
                        setNewStudentSection('');
                      }}>
                        <SelectTrigger data-testid="student-grade-select">
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
                      <Label htmlFor="studentSection">الفصل</Label>
                      <Select value={newStudentSection} onValueChange={setNewStudentSection} disabled={!newStudentGrade}>
                        <SelectTrigger data-testid="student-section-select">
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
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    data-testid="submit-add-student"
                  >
                    إضافة
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  data-testid="add-behavior-button"
                >
                  <Plus className="ml-2 h-4 w-4" />
                  تسجيل سلوك
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="add-behavior-dialog">
                <DialogHeader>
                  <DialogTitle data-testid="add-behavior-dialog-title">تسجيل سلوك جديد</DialogTitle>
                  <DialogDescription data-testid="add-behavior-dialog-description">
                    اختر الطالبة ونوع السلوك والنقاط
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddBehavior} className="space-y-4">
                  <div className="space-y-2">
                    <Label>الطالبة</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger data-testid="student-select">
                        <SelectValue placeholder="اختر طالبة" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id} data-testid={`student-option-${student.id}`}>
                            {student.name} - {student.class_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع السلوك</Label>
                    <Select value={behaviorType} onValueChange={setBehaviorType}>
                      <SelectTrigger data-testid="behavior-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive" data-testid="positive-option">إيجابي</SelectItem>
                        <SelectItem value="negative" data-testid="negative-option">سلبي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>النقاط (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      required
                      data-testid="points-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اكتب وصف السلوك..."
                      required
                      data-testid="description-textarea"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    data-testid="submit-behavior"
                  >
                    تسجيل
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Students Table */}
        <Card className="shadow-lg" data-testid="students-table-card">
          <CardHeader>
            <CardTitle data-testid="students-table-title">قائمة الطالبات</CardTitle>
            <CardDescription data-testid="students-table-description">جميع طالبات المدرسة ونقاطهن</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الصف</TableHead>
                  <TableHead className="text-right">إجمالي النقاط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow key={student.id} data-testid={`student-row-${index}`}>
                    <TableCell className="font-medium" data-testid={`student-name-${index}`}>{student.name}</TableCell>
                    <TableCell data-testid={`student-class-${index}`}>{student.class_name}</TableCell>
                    <TableCell data-testid={`student-points-${index}`}>
                      <Badge 
                        className={student.total_points >= 0 ? 'bg-green-500' : 'bg-red-500'}
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
      </main>
    </div>
  );
};

export default TeacherDashboard;