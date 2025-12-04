import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { ArrowRight, Download, FileSpreadsheet, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportsPage = ({ user }) => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('weekly');
  const [selectedClass, setSelectedClass] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Extract unique classes
      const uniqueClasses = [...new Set(response.data.map(s => s.class_name))].sort();
      setClasses(uniqueClasses);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const classParam = selectedClass === 'all' ? '' : `?class_name=${selectedClass}`;
      const response = await axios.get(`${API}/reports/${reportType}${classParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      toast.error('فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData || !reportData.data) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    // Prepare data for Excel
    const excelData = reportData.data.map((row, index) => ({
      'الترتيب': index + 1,
      'اسم الطالبة': row.student_name,
      'الصف': row.class_name,
      'إجمالي النقاط': row.total_points,
      'السلوكيات الإيجابية': row.positive_count,
      'نقاط إيجابية': row.positive_points,
      'السلوكيات السلبية': row.negative_count,
      'نقاط سلبية': row.negative_points,
      'صافي النقاط': row.net_points,
      'إجمالي السلوكيات': row.total_behaviors
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير');

    // Set column widths
    const colWidths = [
      { wch: 10 }, // الترتيب
      { wch: 30 }, // اسم الطالبة
      { wch: 15 }, // الصف
      { wch: 15 }, // إجمالي النقاط
      { wch: 20 }, // السلوكيات الإيجابية
      { wch: 15 }, // نقاط إيجابية
      { wch: 20 }, // السلوكيات السلبية
      { wch: 15 }, // نقاط سلبية
      { wch: 15 }, // صافي النقاط
      { wch: 20 }  // إجمالي السلوكيات
    ];
    ws['!cols'] = colWidths;

    // Generate file name
    const reportTypeAr = reportType === 'weekly' ? 'أسبوعي' : 'شهري';
    const classText = selectedClass === 'all' ? 'جميع_الصفوف' : selectedClass.replace('/', '_');
    const fileName = `تقرير_${reportTypeAr}_${classText}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
    toast.success('تم تصدير التقرير بنجاح');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-green-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                التقارير
              </h1>
              <p className="text-sm text-gray-600">مرحباً، {user.name}</p>
            </div>
            <Button 
              onClick={() => navigate(`/${user.role}`)} 
              variant="outline"
              data-testid="back-button"
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="ml-2 h-5 w-5 text-blue-600" />
              إعدادات التقرير
            </CardTitle>
            <CardDescription>اختر نوع التقرير والصف والفصل</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع التقرير</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger data-testid="report-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">تقرير أسبوعي (آخر 7 أيام)</SelectItem>
                    <SelectItem value="monthly">تقرير شهري (آخر 30 يوم)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الصف والفصل</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger data-testid="class-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الصفوف</SelectItem>
                    {classes.map((className) => (
                      <SelectItem key={className} value={className}>
                        الصف {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button 
                  onClick={fetchReport}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  data-testid="generate-report-button"
                >
                  {loading ? 'جاري التحميل...' : 'إنشاء التقرير'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Statistics */}
        {reportData && (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="border-2 border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">إجمالي الطالبات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{reportData.total_students}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">السلوكيات الإيجابية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {reportData.data.reduce((sum, d) => sum + d.positive_count, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">السلوكيات السلبية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {reportData.data.reduce((sum, d) => sum + d.negative_count, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">صافي النقاط</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {reportData.data.reduce((sum, d) => sum + d.net_points, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Button */}
            <div className="mb-4 flex justify-end">
              <Button 
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700"
                data-testid="export-button"
              >
                <FileSpreadsheet className="ml-2 h-4 w-4" />
                تصدير إلى Excel
              </Button>
            </div>

            {/* Report Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>تفاصيل التقرير</CardTitle>
                <CardDescription>
                  {reportType === 'weekly' ? 'تقرير أسبوعي' : 'تقرير شهري'} 
                  {selectedClass !== 'all' ? ` - الصف ${selectedClass}` : ' - جميع الصفوف'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الترتيب</TableHead>
                      <TableHead className="text-right">اسم الطالبة</TableHead>
                      <TableHead className="text-right">الصف</TableHead>
                      <TableHead className="text-right">إجمالي النقاط</TableHead>
                      <TableHead className="text-right">إيجابي</TableHead>
                      <TableHead className="text-right">سلبي</TableHead>
                      <TableHead className="text-right">صافي النقاط</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.data.map((row, index) => (
                      <TableRow key={row.student_id}>
                        <TableCell className="font-bold">{index + 1}</TableCell>
                        <TableCell className="font-medium">{row.student_name}</TableCell>
                        <TableCell>{row.class_name}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-600">{row.total_points}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              {row.positive_count} ({row.positive_points})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 font-medium">
                              {row.negative_count} ({row.negative_points})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={row.net_points >= 0 ? 'bg-green-600' : 'bg-red-600'}>
                            {row.net_points > 0 ? '+' : ''}{row.net_points}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!reportData && !loading && (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <FileSpreadsheet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">لم يتم إنشاء تقرير بعد</h3>
              <p className="text-gray-500">اختر نوع التقرير والصف ثم اضغط على "إنشاء التقرير"</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ReportsPage;
