from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta
import bcrypt
import models
import os
from database import get_db, init_database, check_db_connection
from simple_recommendations import generate_dynamic_recommendations
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth models
class UserSignUp(BaseModel):
    email: str
    password: str
    name: str

class UserSignIn(BaseModel):
    email: str
    password: str

class UserSync(BaseModel):
    email: str
    name: str | None = None
    image_url: str | None = None

class LoginSession(BaseModel):
    user_email: str
    session_token: str
    provider: str = "google"
    ip_address: str | None = None
    user_agent: str | None = None
    device_info: dict | None = None
    location_info: dict | None = None
    login_method: str = "oauth"

class RecommendationRequest(BaseModel):
    area: str
    user_email: str = "anonymous"
    language: str = "English"

class BusinessPlanRequest(BaseModel):
    business_title: str
    area: str
    user_email: str = "anonymous"
    language: str = "English"


class SubscriptionCreate(BaseModel):
    user_email: str
    plan_name: str
    plan_display_name: str
    billing_cycle: str
    price: float
    currency: str = "USD"
    max_analyses: int = 5
    features: dict
    razorpay_subscription_id: str | None = None
    razorpay_customer_id: str | None = None

class SubscriptionUpdate(BaseModel):
    status: str | None = None
    subscription_end: str | None = None
    max_analyses: int | None = None
    features: dict | None = None

class LocationResponse(BaseModel):
    country: str
    city: str
    currency: str
    country_code: str
    ip: str | None = None

class PaymentCreate(BaseModel):
    user_email: str
    subscription_id: int | None = None
    amount: float
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str | None = None
    status: str = "success"
    payment_method: str | None = None
    plan_name: str
    billing_cycle: str


@app.on_event("startup")
def startup_event():
    """
    Ensure the database is ready before serving requests.
    This will create the tables (users, subscriptions, profiles, payments, etc.)
    and verify that the connection works.
    """
    # Initialize tables if they don't exist
    init_database()
    # Check basic connectivity (logs result)
    check_db_connection()

# Simple global cache for location data (IP -> data)
LOCATION_CACHE = {}

@app.get("/api/system/location")
async def get_system_location(request: Request):
    """Proxy for location data to avoid CORS and rate limits with caching"""
    import httpx
    
    # Try to get client IP from headers (behind proxy like Render/Cloudflare)
    client_ip = "127.0.0.1"
    if hasattr(request, 'headers'):
        client_ip = request.headers.get("x-forwarded-for") or request.headers.get("x-real-ip") or (request.client.host if request.client else "127.0.0.1")
        # If multiple IPs in x-forwarded-for, take the first one
        if "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()

    # Check cache first (cache for 1 hour roughly by clearing it occasionally, or just keep it simple)
    if client_ip in LOCATION_CACHE:
        # print(f"DEBUG: Returning cached location for IP: {client_ip}")
        return LOCATION_CACHE[client_ip]

    apis = [
        f"https://ipapi.co/{client_ip}/json/" if client_ip != "127.0.0.1" else "https://ipapi.co/json/",
        "https://ip-api.com/json/",
        "https://api.bigdatacloud.net/data/reverse-geocode-client"
    ]
    
    for api in apis:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(api, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    location_data = {
                        "country": data.get("country_name") or data.get("country") or "Unknown",
                        "city": data.get("city") or "Unknown",
                        "currency": data.get("currency") or "USD",
                        "country_code": data.get("country_code") or data.get("countryCode") or "US",
                        "ip": data.get("ip") or data.get("query") or client_ip
                    }
                    # Save to cache
                    if client_ip != "127.0.0.1":
                        LOCATION_CACHE[client_ip] = location_data
                    return location_data
        except Exception as e:
            print(f"Location API {api} failed: {e}")
            continue
            
    fallback_data = {
        "country": "India",
        "city": "Bhopal",
        "currency": "INR",
        "country_code": "IN",
        "ip": client_ip
    }
    return fallback_data

@app.get("/")
def read_root():
    return {"message": "Welcome to the Business Recommendation API"}

# Authentication endpoints
@app.get("/api/auth/test")
def test_auth():
    """Test endpoint to verify auth endpoints are working"""
    return {"status": "ok", "message": "Auth endpoints are working"}

@app.post("/api/auth/signup")
def sign_up(user_data: UserSignUp, db: Session = Depends(get_db)):
    """Sign up with email and password"""
    print(f"Sign up attempt for: {user_data.email}")
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Validate password strength
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create new user
    db_user = models.User(
        email=user_data.email,
        name=user_data.name,
        password_hash=password_hash,
        auth_provider="email",
        login_count=1,
        last_login=func.now()
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print(f"User created successfully: {user_data.email}")
    return {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.name,
        "image_url": db_user.image_url
    }

@app.post("/api/auth/signin")
def sign_in(user_data: UserSignIn, db: Session = Depends(get_db)):
    """Sign in with email and password"""
    print(f"Sign in attempt for: {user_data.email}")
    
    # Find user
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has a password (might be OAuth only)
    if not db_user.password_hash:
        raise HTTPException(status_code=401, detail="This account uses social login. Please sign in with Google.")
    
    # Verify password
    if not bcrypt.checkpw(user_data.password.encode('utf-8'), db_user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update login info
    db_user.login_count = (db_user.login_count or 0) + 1
    db_user.last_login = func.now()
    db.commit()
    
    print(f"User signed in successfully: {user_data.email}")
    return {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.name,
        "image_url": db_user.image_url
    }

@app.post("/api/users/sync")
def sync_user(user_data: UserSync, db: Session = Depends(get_db)):
    """Sync user from NextAuth, creating if not exists"""
    from sqlalchemy import func
    email_normalized = user_data.email.lower().strip()
    print(f"DEBUG: Syncing user {email_normalized}")
    
    db_user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    
    if db_user:
        # Update existing user
        db_user.name = user_data.name or db_user.name
        db_user.image_url = user_data.image_url or db_user.image_url
        db_user.login_count = (db_user.login_count or 0) + 1
        db_user.last_login = func.now()
    else:
        # Create new user
        db_user = models.User(
            email=email_normalized,
            name=user_data.name,
            image_url=user_data.image_url,
            login_count=1,
            last_login=func.now(),
            auth_provider="google"
        )
        db.add(db_user)
    
    db.commit()
    db.refresh(db_user)
    return {"status": "ok", "user_id": db_user.id}

@app.post("/api/users/login-session")
def create_login_session(session: LoginSession, db: Session = Depends(get_db)):
    """Create a new login session record"""
    print(f"Creating login session for user: {session.user_email}")
    
    try:
        # End any existing active sessions for this user
        existing_sessions = db.query(models.UserSession).filter(
            models.UserSession.user_email == session.user_email,
            models.UserSession.is_active == True
        ).all()
        
        for existing_session in existing_sessions:
            existing_session.is_active = False
            existing_session.session_end = func.now()
        
        # Create new session
        db_session = models.UserSession(
            user_email=session.user_email,
            session_token=session.session_token,
            provider=session.provider,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            device_info=session.device_info,
            location_info=session.location_info,
            login_method=session.login_method
        )
        
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        print(f"Created login session: {db_session.id}")
        return {"status": "ok", "session_id": db_session.id}
    except Exception as e:
        print(f"Failed to create login session (ignoring missing table): {e}")
        db.rollback()
        return {"status": "ok", "session_id": -1}

@app.post("/api/recommendations")
def get_recommendations(request: RecommendationRequest, db: Session = Depends(get_db)):
    print(f"--- API CALLED - Starting recommendations for: {request.area}")
    print(f"--- User email: {request.user_email}")
    print(f"--- Language: {request.language}")
    
    try:
        print("[SUCCESS] Calling generate_dynamic_recommendations...")
        # Generate dynamic recommendations
        result = generate_dynamic_recommendations(request.area, request.user_email, request.language)
        print(f"[SUCCESS] Generated {len(result['recommendations'])} recommendations")
        
        # Save to database
        db_record = models.SearchHistory(
            user_email=request.user_email,
            area=request.area,
            analysis=result["analysis"],
            recommendations=result["recommendations"]
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        print(f"💾 Saved to database with ID: {db_record.id}")
        
        return {
            "id": db_record.id,
            "area": db_record.area,
            "analysis": db_record.analysis,
            "recommendations": db_record.recommendations,
            "logs": {
                "reddit": [],
                "web": []
            }
        }
        
    except Exception as e:
        print(f"[ERROR] Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        
        # Return a simple fallback
        fallback_rec = {
            "title": f"Service Business in {request.area}",
            "description": f"Local service business opportunity in {request.area}",
            "profitability_score": 80,
            "funding_required": "₹5L-₹15L",
            "estimated_revenue": "₹25L/year",
            "estimated_profit": "₹15L/year",
            "roi_percentage": 120,
            "payback_period": "12 months",
            "market_size": "Medium",
            "competition_level": "Medium",
            "startup_difficulty": "Medium",
            "key_success_factors": ["Local knowledge", "Quality service"],
            "target_customers": "Local residents and businesses",
            "seasonal_impact": "Low",
            "scalability": "Medium",
            "business_model": "Service fees",
            "initial_team_size": "2-3 people",
            "six_month_plan": ["Setup", "Launch", "Grow"],
            "investment_breakdown": {"startup_costs": "Initial setup", "monthly_expenses": "Operations"}
        }
        
        print("🔄 Returning fallback recommendation")
        
        return {
            "id": 0,
            "area": request.area,
            "analysis": f"Market analysis for {request.area}",
            "recommendations": [fallback_rec],
            "logs": {"reddit": [], "web": []}
        }

@app.get("/api/history/{email}")
def get_history(email: str, db: Session = Depends(get_db)):
    history = db.query(models.SearchHistory).filter(models.SearchHistory.user_email == email).order_by(models.SearchHistory.created_at.desc()).all()
    return history

@app.post("/api/business-plan")
def get_business_plan(request: BusinessPlanRequest, db: Session = Depends(get_db)):
    """Generate a detailed 6-month business plan for a specific business idea"""
    
    # Determine if this is an Indian location for currency formatting
    area_lower = request.area.lower()
    is_indian_city = 'india' in area_lower or any(city in area_lower for city in ['mumbai', 'delhi', 'bangalore', 'chennai', 'bhopal', 'berasia', 'pune', 'kolkata'])
    currency = "₹" if is_indian_city else "$"
    
    print(f"--- Generating business plan for: {request.title if hasattr(request, 'title') else request.business_title} in {request.area}")
    
    # Generate a comprehensive business plan using local data
    try:
        # Enhanced fallback business plan with realistic, location-specific data
        business_plan = {
            "business_overview": f"Comprehensive business plan for {request.business_title} in {request.area}. This venture focuses on addressing local market needs through innovative solutions and customer-centric approach. The business model is designed to leverage local market opportunities while maintaining competitive advantages through quality service delivery and strategic positioning.",
            "market_analysis": f"Market analysis for {request.area} shows strong potential for {request.business_title}. The local demographic profile indicates growing demand for quality services, with moderate competition providing opportunities for market entry. Consumer spending patterns and economic indicators suggest favorable conditions for business growth.",
            "financial_projections": {
                "month_1": {"revenue": f"{currency}{'50K' if is_indian_city else '2K'}", "expenses": f"{currency}{'80K' if is_indian_city else '3K'}", "profit": f"-{currency}{'30K' if is_indian_city else '1K'}"},
                "month_2": {"revenue": f"{currency}{'80K' if is_indian_city else '3.5K'}", "expenses": f"{currency}{'70K' if is_indian_city else '2.8K'}", "profit": f"{currency}{'10K' if is_indian_city else '700'}"},
                "month_3": {"revenue": f"{currency}{'120K' if is_indian_city else '5K'}", "expenses": f"{currency}{'75K' if is_indian_city else '3K'}", "profit": f"{currency}{'45K' if is_indian_city else '2K'}"},
                "month_4": {"revenue": f"{currency}{'150K' if is_indian_city else '6.5K'}", "expenses": f"{currency}{'80K' if is_indian_city else '3.2K'}", "profit": f"{currency}{'70K' if is_indian_city else '3.3K'}"},
                "month_5": {"revenue": f"{currency}{'180K' if is_indian_city else '8K'}", "expenses": f"{currency}{'85K' if is_indian_city else '3.5K'}", "profit": f"{currency}{'95K' if is_indian_city else '4.5K'}"},
                "month_6": {"revenue": f"{currency}{'220K' if is_indian_city else '10K'}", "expenses": f"{currency}{'90K' if is_indian_city else '3.8K'}", "profit": f"{currency}{'130K' if is_indian_city else '6.2K'}"}
            },
            "marketing_strategy": f"Multi-channel marketing approach tailored for {request.area} market. Digital marketing through social media platforms popular in the region, local partnerships with complementary businesses, referral programs leveraging community networks, and targeted advertising in local media. Focus on building brand awareness through community engagement and word-of-mouth marketing.",
            "operational_plan": f"Streamlined operations designed for {request.area} market conditions. Implementation of efficient systems for inventory management, customer service, and performance tracking. Quality control processes to ensure consistent service delivery. Staff training programs to maintain service standards. Technology integration for operational efficiency and customer convenience.",
            "risk_analysis": f"Key risks for {request.business_title} in {request.area} include market competition from established players, economic fluctuations affecting consumer spending, regulatory changes, and operational challenges. Mitigation strategies include diversification of revenue streams, maintaining emergency funds equivalent to 3 months operating expenses, flexible business model adaptation, and strong customer relationship management.",
            "monthly_milestones": [
                f"Month 1: Business registration and permits in {request.area}, initial team hiring, location setup, supplier partnerships",
                f"Month 2: Launch operations, acquire first 20-30 customers, establish service processes, local marketing campaign",
                f"Month 3: Optimize operations based on feedback, expand service offerings, build community partnerships",
                f"Month 4: Scale operations to 50+ customers, implement customer retention programs, enhance marketing efforts",
                f"Month 5: Build strategic partnerships, develop referral programs, expand team if needed, improve operational efficiency",
                f"Month 6: Evaluate performance metrics, plan expansion strategies, consider additional locations or services"
            ],
            "success_metrics": [
                "Monthly revenue growth rate",
                "Customer acquisition cost",
                "Customer lifetime value",
                "Customer satisfaction scores",
                "Profit margins",
                "Market share in local area",
                "Employee productivity metrics",
                "Operational efficiency ratios"
            ],
            "resource_requirements": f"Initial team of 3-5 people including management and operational staff. Equipment and technology requirements based on business type. Working capital for 3-4 months of operations ({currency}{'2-3L' if is_indian_city else '8-12K'}). Marketing budget for first 6 months ({currency}{'50K' if is_indian_city else '2K'}). Operational space suitable for {request.area} market conditions.",
            "exit_strategy": f"Long-term growth strategy includes market expansion within {request.area} region, potential franchising opportunities for scalable business models, strategic partnerships with larger industry players, or acquisition opportunities. Timeline for exit consideration: 3-5 years with established market presence and proven profitability."
        }
        
        # Save to database
        db_plan = models.BusinessPlan(
            user_email=request.user_email.lower().strip(),
            business_title=request.business_title,
            area=request.area,
            plan_data=business_plan
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        
        print(f"[SUCCESS] Generated and saved business plan for {request.business_title}")
        return business_plan
        
    except Exception as e:
        print(f"[ERROR] Error generating business plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate business plan")

class RoadmapRequest(BaseModel):
    area: str
    title: str
    description: str
    user_email: str = "anonymous"
    language: str = "English"

@app.post("/api/roadmap")
def get_roadmap(request: RoadmapRequest, db: Session = Depends(get_db)):
    """Generate a strategic 6-month roadmap for a business opportunity"""
    
    # Determine if this is an Indian location for currency formatting
    area_lower = request.area.lower()
    is_indian_city = 'india' in area_lower or any(city in area_lower for city in ['mumbai', 'delhi', 'bangalore', 'chennai', 'bhopal', 'berasia', 'pune', 'kolkata'])
    currency = "₹" if is_indian_city else "$"
    
    print(f"--- Generating roadmap for: {request.title} in {request.area}")
    
    try:
        # Generate strategic roadmap steps
        roadmap_steps = [
            {
                "step_number": 1,
                "step_title": "Market Research & Validation",
                "step_description": f"Conduct comprehensive market research in {request.area} to validate the business opportunity for {request.title}. Analyze local competition, customer demographics, and market demand. Survey potential customers to understand their needs and willingness to pay. Identify key market gaps and positioning opportunities."
            },
            {
                "step_number": 2,
                "step_title": "Business Foundation & Legal Setup",
                "step_description": f"Establish the legal foundation for your business in {request.area}. Register your business entity, obtain necessary licenses and permits, set up business banking, and ensure compliance with local regulations. Create a strong brand identity and secure intellectual property protection where applicable."
            },
            {
                "step_number": 3,
                "step_title": "Product Development & Testing",
                "step_description": f"Develop your minimum viable product (MVP) or service offering for {request.title}. Create prototypes, test with early customers in {request.area}, gather feedback, and iterate based on market response. Focus on quality and customer satisfaction to build a strong foundation."
            },
            {
                "step_number": 4,
                "step_title": "Team Building & Operations",
                "step_description": f"Build your core team with the right skills for {request.title} in {request.area}. Establish operational processes, supply chain partnerships, and quality control systems. Set up your workspace and implement technology solutions for efficient operations."
            },
            {
                "step_number": 5,
                "step_title": "Marketing & Customer Acquisition",
                "step_description": f"Launch comprehensive marketing campaigns targeting {request.area} market. Implement digital marketing strategies, build local partnerships, and create referral programs. Focus on acquiring your first 100 customers and building brand awareness in the local community."
            },
            {
                "step_number": 6,
                "step_title": "Scale & Optimize",
                "step_description": f"Scale your operations based on market response and optimize for profitability. Analyze performance metrics, expand your team if needed, and consider additional locations or services. Plan for long-term growth and sustainability in {request.area} and beyond."
            }
        ]
        
        roadmap_data = {
            "steps": roadmap_steps,
            "timeline": "6 months",
            "area": request.area,
            "title": request.title,
            "description": request.description,
            "success_factors": [
                "Strong market research and validation",
                "Efficient operational setup",
                "Effective marketing and customer acquisition",
                "Continuous optimization and adaptation"
            ]
        }

        # Save to database
        db_roadmap = models.Roadmap(
            user_email=request.user_email.lower().strip(),
            title=request.title,
            area=request.area,
            roadmap_data=roadmap_data
        )
        db.add(db_roadmap)
        db.commit()
        db.refresh(db_roadmap)
        
        print(f"✅ Generated and saved roadmap for {request.title}")
        return roadmap_data
        
    except Exception as e:
        print(f"❌ Error generating roadmap: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate roadmap")

@app.post("/api/subscriptions")
def create_subscription(subscription: SubscriptionCreate, db: Session = Depends(get_db)):
    """Create or update user subscription"""
    from sqlalchemy import func
    
    email_normalized = subscription.user_email.lower().strip()
    print(f"DEBUG: Creating subscription for {email_normalized} - Plan: {subscription.plan_name}")
    
    # Check if user already has an active subscription
    existing = db.query(models.UserSubscription).filter(
        func.lower(models.UserSubscription.user_email) == email_normalized,
        models.UserSubscription.status == "active"
    ).first()
    
    # Get User ID
    user_rec = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    if not user_rec:
        print(f"DEBUG: User {email_normalized} not found during subscription creation")
    u_id = user_rec.id if user_rec else None

    if existing:
        # Update existing subscription instead of creating new
        existing.user_id = u_id
        existing.plan_name = subscription.plan_name
        existing.plan_display_name = subscription.plan_display_name
        existing.billing_cycle = subscription.billing_cycle
        existing.price = subscription.price
        existing.currency = subscription.currency
        existing.max_analyses = subscription.max_analyses
        existing.features = subscription.features
        existing.razorpay_subscription_id = subscription.razorpay_subscription_id
        existing.razorpay_customer_id = subscription.razorpay_customer_id
        
        # Extend/Refresh subscription end date
        existing.subscription_end = datetime.now() + (timedelta(days=365) if subscription.billing_cycle == "yearly" else timedelta(days=30))
        
        db.commit()
        db.refresh(existing)
        return existing
    
    # Calculate subscription end date
    sub_end = datetime.now() + (timedelta(days=365) if subscription.billing_cycle == "yearly" else timedelta(days=30))

    try:
        # Create new subscription
        db_subscription = models.UserSubscription(
            user_id=u_id,
            user_email=email_normalized,
            plan_name=subscription.plan_name,
            plan_display_name=subscription.plan_display_name,
            billing_cycle=subscription.billing_cycle,
            price=subscription.price,
            currency=subscription.currency,
            max_analyses=subscription.max_analyses,
            features=subscription.features,
            subscription_end=sub_end,
            razorpay_subscription_id=subscription.razorpay_subscription_id,
            razorpay_customer_id=subscription.razorpay_customer_id
        )
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        
        print(f"[SUCCESS] Created subscription: {db_subscription.id} for {email_normalized}")
        
        return {
            "id": db_subscription.id,
            "user_id": db_subscription.user_id,
            "user_email": db_subscription.user_email,
            "plan_name": db_subscription.plan_name,
            "plan_display_name": db_subscription.plan_display_name,
            "status": db_subscription.status
        }
    except Exception as e:
        db.rollback()
        print(f"[ERROR] ERROR in create_subscription: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/subscriptions/{user_email}")
def get_user_subscription(user_email: str, db: Session = Depends(get_db)):
    """Get user's active subscription"""
    from sqlalchemy import func
    
    email_normalized = user_email.lower().strip()
    subscription = db.query(models.UserSubscription).filter(
        func.lower(models.UserSubscription.user_email) == email_normalized,
        models.UserSubscription.status == "active"
    ).first()
    
    if not subscription:
        # Check if user exists at all
        user_exists = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        if not user_exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return a "free" subscription structure as default instead of 404
        return {
            "id": 0,
            "user_email": email_normalized,
            "plan_name": "free",
            "plan_display_name": "Venture Strategist",
            "status": "active",
            "max_analyses": 5,
            "features": {}
        }
    
    # Return as dict to ensure serialization
    return {
        "id": subscription.id,
        "user_id": subscription.user_id,
        "user_email": subscription.user_email,
        "plan_name": subscription.plan_name,
        "plan_display_name": subscription.plan_display_name,
        "billing_cycle": subscription.billing_cycle,
        "price": float(subscription.price) if subscription.price else 0.0,
        "currency": subscription.currency,
        "status": subscription.status,
        "max_analyses": subscription.max_analyses,
        "features": subscription.features,
        "subscription_end": subscription.subscription_end.isoformat() if subscription.subscription_end else None
    }

@app.post("/api/payments")
def create_payment_record(payment: PaymentCreate, db: Session = Depends(get_db)):
    """Create payment record"""
    email_normalized = payment.user_email.lower().strip()
    print(f"DEBUG: Creating payment record for {email_normalized} - Amount: {payment.amount} {payment.currency}")
    
    # Get User ID
    user_rec = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    if not user_rec:
        print(f"DEBUG: User {email_normalized} not found during payment creation")
    u_id = user_rec.id if user_rec else None

    try:
        db_payment = models.PaymentHistory(
            user_id=u_id,
            user_email=payment.user_email.lower().strip(),
            subscription_id=payment.subscription_id,
            amount=payment.amount,
            currency=payment.currency,
            razorpay_payment_id=payment.razorpay_payment_id,
            razorpay_order_id=payment.razorpay_order_id,
            status=payment.status,
            payment_method=payment.payment_method,
            plan_name=payment.plan_name,
            billing_cycle=payment.billing_cycle
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        return db_payment
    except Exception as e:
        db.rollback()
        error_msg = str(e).lower()
        print(f"[ERROR] Failed to create payment record: {e}")
        
        # More robust check for unique constraint violations (IntegrityError)
        if any(term in error_msg for term in ["duplicate key", "unique constraint", "already exists"]):
            # Try to find exactly what was unique (the payment id)
            existing = db.query(models.PaymentHistory).filter(models.PaymentHistory.razorpay_payment_id == payment.razorpay_payment_id).first()
            if existing:
                print(f"[INFO] Payment record {payment.razorpay_payment_id} already exists, returning existing.")
                return existing
        
        raise HTTPException(status_code=500, detail=f"Failed to create payment record: {str(e)}")


@app.get("/api/payments/{user_email}")
def get_payment_history(user_email: str, limit: int = 50, db: Session = Depends(get_db)):
    """Get user's payment history"""
    from sqlalchemy import func
    
    email_normalized = user_email.lower().strip()
    payments = db.query(models.PaymentHistory).filter(
        func.lower(models.PaymentHistory.user_email) == email_normalized
    ).order_by(models.PaymentHistory.created_at.desc()).limit(limit).all()
    
    return payments


# Missing user profile and session endpoints
@app.get("/api/users/{email}")
def get_user_info(email: str, db: Session = Depends(get_db)):
    """Get user basic information"""
    from sqlalchemy import func

    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "bio": user.bio,
        "phone": user.phone,
        "image_url": user.image_url,
        "company": user.company,
        "location": user.location,
        "website": user.website,
        "industry": user.industry,
        "auth_provider": user.auth_provider,
        "login_count": user.login_count,
        "last_login": user.last_login,
        "created_at": user.created_at
    }

@app.get("/api/users/{email}/profile")
def get_user_profile(email: str, db: Session = Depends(get_db)):
    """Get user profile information"""
    from sqlalchemy import func

    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user statistics
    search_count = db.query(models.SearchHistory).filter(
        func.lower(models.SearchHistory.user_email) == email_normalized
    ).count()

    # Get subscription info
    subscription = db.query(models.UserSubscription).filter(
        func.lower(models.UserSubscription.user_email) == email_normalized,
        models.UserSubscription.status == "active"
    ).first()
    
    # Get recent payments
    recent_payments = db.query(models.PaymentHistory).filter(
        func.lower(models.PaymentHistory.user_email) == email_normalized
    ).order_by(models.PaymentHistory.created_at.desc()).limit(10).all()

    return {
        "user": user,
        "analysis_count": search_count,
        "subscription": subscription,
        "recent_payments": [
            {
                "id": payment.id,
                "amount": payment.amount,
                "currency": "INR",
                "razorpay_payment_id": payment.razorpay_payment_id,
                "status": payment.status,
                "plan_name": payment.plan_name,
                "billing_cycle": payment.billing_cycle,
                "payment_date": payment.created_at,
                "payment_method": payment.payment_method
            }
            for payment in recent_payments
        ]
    }

@app.get("/api/users/{email}/sessions")
def get_user_sessions(email: str, limit: int = 10, db: Session = Depends(get_db)):
    """Get user login sessions"""
    from sqlalchemy import func

    email_normalized = email.lower().strip()

    try:
        sessions = db.query(models.UserSession).filter(
            func.lower(models.UserSession.user_email) == email_normalized
        ).order_by(models.UserSession.session_start.desc()).limit(limit).all()

        return [
            {
                "id": session.id,
                "session_token": session.session_token[:8] + "..." if session.session_token else "unknown",
                "provider": session.provider,
                "ip_address": session.ip_address,
                "user_agent": session.user_agent,
                "device_info": session.device_info,
                "location_info": session.location_info,
                "login_method": session.login_method,
                "session_start": session.session_start,
                "session_end": session.session_end,
                "is_active": session.is_active
            }
            for session in sessions
        ]
    except Exception as e:
        print(f"Failed to fetch sessions (table might not exist): {e}")
        # Return empty list if sessions table doesn't exist
        return []


# Add missing PUT endpoint for user updates
class UserUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
    phone: str | None = None
    image_url: str | None = None
    company: str | None = None
    location: str | None = None
    website: str | None = None
    industry: str | None = None

@app.put("/api/users/{email}")
def update_user_profile(email: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile information"""
    from sqlalchemy import func
    
    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields if provided
    if user_update.name is not None:
        user.name = user_update.name.strip()
    if user_update.image_url is not None:
        user.image_url = user_update.image_url
    if user_update.bio is not None:
        user.bio = user_update.bio.strip()
    if user_update.phone is not None:
        user.phone = user_update.phone.strip()
    if user_update.company is not None:
        user.company = user_update.company.strip()
    if user_update.location is not None:
        user.location = user_update.location.strip()
    if user_update.website is not None:
        user.website = user_update.website.strip()
    if user_update.industry is not None:
        user.industry = user_update.industry.strip()
    
    try:
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "bio": user.bio,
            "phone": user.phone,
            "image_url": user.image_url,
            "company": user.company,
            "location": user.location,
            "website": user.website,
            "industry": user.industry,
            "auth_provider": user.auth_provider,
            "login_count": user.login_count,
            "last_login": user.last_login,
            "created_at": user.created_at,
            "message": "Profile updated successfully"
        }
    except Exception as e:
        db.rollback()
        print(f"Failed to update user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)