#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class TamayyuzAPITester:
    def __init__(self, base_url="https://campus-connect-387.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.teacher_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_student_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_api_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_detail = response.json().get('detail', 'No error detail')
                    details += f", Error: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_api_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_user_registration_and_login(self):
        """Test user registration and login for all roles"""
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Test Admin Registration
        admin_data = {
            "name": f"مدير اختبار {timestamp}",
            "email": f"admin{timestamp}@test.com",
            "password": "test123",
            "role": "admin"
        }
        
        success, response = self.run_api_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
        
        # Test Teacher Registration
        teacher_data = {
            "name": f"معلمة اختبار {timestamp}",
            "email": f"teacher{timestamp}@test.com",
            "password": "test123",
            "role": "teacher"
        }
        
        success, response = self.run_api_test(
            "Teacher Registration",
            "POST",
            "auth/register",
            200,
            teacher_data
        )
        
        if success and 'access_token' in response:
            self.teacher_token = response['access_token']
        
        # Test Student Registration
        student_data = {
            "name": f"طالبة اختبار {timestamp}",
            "email": f"student{timestamp}@test.com",
            "password": "test123",
            "role": "student"
        }
        
        success, response = self.run_api_test(
            "Student Registration",
            "POST",
            "auth/register",
            200,
            student_data
        )
        
        if success and 'access_token' in response:
            self.student_token = response['access_token']

        # Test Login with existing credentials
        login_data = {
            "email": f"admin{timestamp}@test.com",
            "password": "test123"
        }
        
        success, response = self.run_api_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            login_data
        )

        return self.admin_token and self.teacher_token and self.student_token

    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint with different tokens"""
        if not self.admin_token:
            self.log_test("Auth Me - Admin", False, "No admin token available")
            return False

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_api_test(
            "Auth Me - Admin",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        
        return success

    def test_student_operations(self):
        """Test student CRUD operations"""
        if not self.teacher_token:
            self.log_test("Student Operations", False, "No teacher token available")
            return False

        headers = {'Authorization': f'Bearer {self.teacher_token}'}
        
        # Test Get Students
        success, response = self.run_api_test(
            "Get Students List",
            "GET",
            "students",
            200,
            headers=headers
        )
        
        # Test Create Student
        student_data = {
            "name": "طالبة جديدة للاختبار",
            "class_name": "الصف الأول أ"
        }
        
        success, response = self.run_api_test(
            "Create Student",
            "POST",
            "students",
            200,
            student_data,
            headers
        )
        
        if success and 'id' in response:
            self.created_student_id = response['id']
            
            # Test Get Single Student
            success, response = self.run_api_test(
                "Get Single Student",
                "GET",
                f"students/{self.created_student_id}",
                200,
                headers=headers
            )

        return success

    def test_behavior_operations(self):
        """Test behavior recording operations"""
        if not self.teacher_token or not self.created_student_id:
            self.log_test("Behavior Operations", False, "Missing teacher token or student ID")
            return False

        headers = {'Authorization': f'Bearer {self.teacher_token}'}
        
        # Test Create Positive Behavior
        positive_behavior = {
            "student_id": self.created_student_id,
            "behavior_type": "positive",
            "points": 8,
            "description": "مشاركة ممتازة في الحصة"
        }
        
        success, response = self.run_api_test(
            "Create Positive Behavior",
            "POST",
            "behavior",
            200,
            positive_behavior,
            headers
        )
        
        # Test Create Negative Behavior
        negative_behavior = {
            "student_id": self.created_student_id,
            "behavior_type": "negative",
            "points": 3,
            "description": "تأخير في تسليم الواجب"
        }
        
        success, response = self.run_api_test(
            "Create Negative Behavior",
            "POST",
            "behavior",
            200,
            negative_behavior,
            headers
        )
        
        # Test Get Student Behavior Records
        success, response = self.run_api_test(
            "Get Student Behavior Records",
            "GET",
            f"behavior/student/{self.created_student_id}",
            200,
            headers=headers
        )
        
        return success

    def test_statistics_endpoint(self):
        """Test statistics endpoint (admin only)"""
        if not self.admin_token:
            self.log_test("Statistics Endpoint", False, "No admin token available")
            return False

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_api_test(
            "Get Statistics",
            "GET",
            "statistics",
            200,
            headers=headers
        )
        
        return success

    def test_points_validation(self):
        """Test points validation (should be 1-10)"""
        if not self.teacher_token or not self.created_student_id:
            self.log_test("Points Validation", False, "Missing teacher token or student ID")
            return False

        headers = {'Authorization': f'Bearer {self.teacher_token}'}
        
        # Test invalid points (too high)
        invalid_behavior = {
            "student_id": self.created_student_id,
            "behavior_type": "positive",
            "points": 15,  # Invalid - too high
            "description": "اختبار نقاط غير صحيحة"
        }
        
        success, response = self.run_api_test(
            "Points Validation - Too High",
            "POST",
            "behavior",
            400,  # Should fail with 400
            invalid_behavior,
            headers
        )
        
        # Test invalid points (too low)
        invalid_behavior["points"] = 0  # Invalid - too low
        
        success, response = self.run_api_test(
            "Points Validation - Too Low",
            "POST",
            "behavior",
            400,  # Should fail with 400
            invalid_behavior,
            headers
        )
        
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        # Test without token
        success, response = self.run_api_test(
            "Unauthorized Access - No Token",
            "GET",
            "students",
            401  # Should fail with 401
        )
        
        # Test with invalid token
        headers = {'Authorization': 'Bearer invalid-token'}
        success, response = self.run_api_test(
            "Unauthorized Access - Invalid Token",
            "GET",
            "students",
            401,  # Should fail with 401
            headers=headers
        )
        
        return success

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 بدء اختبار منصة رواد التميز")
        print("=" * 50)
        
        # Basic connectivity
        self.test_root_endpoint()
        
        # Authentication tests
        self.test_user_registration_and_login()
        self.test_auth_me_endpoint()
        
        # Student operations
        self.test_student_operations()
        
        # Behavior operations
        self.test_behavior_operations()
        
        # Statistics
        self.test_statistics_endpoint()
        
        # Validation tests
        self.test_points_validation()
        self.test_unauthorized_access()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 ملخص النتائج:")
        print(f"✅ اختبارات نجحت: {self.tests_passed}")
        print(f"❌ اختبارات فشلت: {self.tests_run - self.tests_passed}")
        print(f"📈 معدل النجاح: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TamayyuzAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, ensure_ascii=False, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())