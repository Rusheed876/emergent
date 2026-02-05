#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class PulseAPITester:
    def __init__(self, base_url="https://citybeat-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seeding initial data"""
        print("\n🌱 Testing Data Seeding...")
        success, response = self.run_test(
            "Seed initial data",
            "POST",
            "seed",
            200
        )
        return success

    def test_cities_endpoint(self):
        """Test cities endpoint"""
        print("\n🏙️ Testing Cities Endpoint...")
        success, response = self.run_test(
            "Get cities list",
            "GET", 
            "cities",
            200
        )
        
        if success and 'cities' in response:
            cities = response['cities']
            expected_cities = ['kingston', 'miami', 'nyc']
            found_cities = [city['id'] for city in cities]
            
            for city in expected_cities:
                if city in found_cities:
                    self.log_test(f"City {city} available", True)
                else:
                    self.log_test(f"City {city} available", False, f"Missing city: {city}")
        
        return success

    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing User Registration...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime("%H%M%S")
        test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "username": f"testuser_{timestamp}",
            "city": "miami"
        }
        
        success, response = self.run_test(
            "Register new user",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.log_test("Token received on registration", True)
        else:
            self.log_test("Token received on registration", False, "No token in response")
        
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        print("\n🔐 Testing User Login...")
        
        if not self.token:
            self.log_test("Login test skipped", False, "No registered user to test login")
            return False
        
        # Try to get user profile to verify token works
        success, response = self.run_test(
            "Get user profile (verify token)",
            "GET",
            "auth/me",
            200
        )
        
        return success

    def test_events_endpoints(self):
        """Test events-related endpoints"""
        print("\n🎉 Testing Events Endpoints...")
        
        # Get all events
        success, response = self.run_test(
            "Get all events",
            "GET",
            "events",
            200
        )
        
        events = response if success else []
        
        # Test city-specific events
        for city in ['kingston', 'miami', 'nyc']:
            success, response = self.run_test(
                f"Get events for {city}",
                "GET",
                f"events?city={city}",
                200
            )
        
        # Test event filters
        success, response = self.run_test(
            "Get events with genre filter",
            "GET",
            "events?genre=dancehall",
            200
        )
        
        success, response = self.run_test(
            "Get events with vibe filter", 
            "GET",
            "events?vibe=lit",
            200
        )
        
        success, response = self.run_test(
            "Get tonight's events",
            "GET",
            "events?date_filter=tonight",
            200
        )
        
        # Test individual event if we have events
        if events and len(events) > 0:
            event_id = events[0]['id']
            success, response = self.run_test(
                "Get individual event",
                "GET",
                f"events/{event_id}",
                200
            )
            
            # Test attend event (requires auth)
            if self.token:
                success, response = self.run_test(
                    "Attend event",
                    "POST",
                    f"events/{event_id}/attend",
                    200
                )
        
        return True

    def test_feed_endpoints(self):
        """Test city feed endpoints"""
        print("\n📱 Testing Feed Endpoints...")
        
        # Test getting feed for each city
        for city in ['kingston', 'miami', 'nyc']:
            success, response = self.run_test(
                f"Get {city} feed",
                "GET",
                f"feed/{city}",
                200
            )
        
        # Test creating a post (requires auth)
        if self.token:
            post_data = {
                "content": "Test post from API testing!",
                "city": "miami",
                "post_type": "update"
            }
            
            success, response = self.run_test(
                "Create feed post",
                "POST",
                "feed",
                200,
                data=post_data
            )
            
            # Test liking a post
            if success and 'id' in response:
                post_id = response['id']
                success, response = self.run_test(
                    "Like feed post",
                    "POST",
                    f"feed/{post_id}/like",
                    200
                )
        
        return True

    def test_chat_endpoints(self):
        """Test chat endpoints"""
        print("\n💬 Testing Chat Endpoints...")
        
        # Test getting chat messages for each city
        for city in ['kingston', 'miami', 'nyc']:
            success, response = self.run_test(
                f"Get {city} chat messages",
                "GET",
                f"chat/{city}/messages",
                200
            )
        
        # Test sending a message (requires auth)
        if self.token:
            success, response = self.run_test(
                "Send chat message",
                "POST",
                "chat/miami/message?content=Test message from API testing!",
                200
            )
        
        return True

    def test_profile_endpoints(self):
        """Test user profile endpoints"""
        print("\n👤 Testing Profile Endpoints...")
        
        if not self.token:
            self.log_test("Profile tests skipped", False, "No authenticated user")
            return False
        
        # Get current profile
        success, response = self.run_test(
            "Get user profile",
            "GET",
            "auth/me",
            200
        )
        
        # Update profile
        update_data = {
            "bio": "Updated bio from API testing",
            "favorite_genres": ["dancehall", "hiphop"],
            "favorite_vibes": ["lit", "upscale"]
        }
        
        success, response = self.run_test(
            "Update user profile",
            "PUT",
            "auth/me",
            200,
            data=update_data
        )
        
        return True

    def test_utility_endpoints(self):
        """Test utility endpoints"""
        print("\n🔧 Testing Utility Endpoints...")
        
        success, response = self.run_test(
            "Get genres list",
            "GET",
            "genres",
            200
        )
        
        success, response = self.run_test(
            "Get vibes list", 
            "GET",
            "vibes",
            200
        )
        
        success, response = self.run_test(
            "API root endpoint",
            "GET",
            "",
            200
        )
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting PULSE OF THE CITY API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        self.test_seed_data()
        self.test_cities_endpoint()
        self.test_utility_endpoints()
        self.test_user_registration()
        self.test_user_login()
        self.test_events_endpoints()
        self.test_feed_endpoints()
        self.test_chat_endpoints()
        self.test_profile_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            
            # Print failed tests
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            
            return 1

def main():
    tester = PulseAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())