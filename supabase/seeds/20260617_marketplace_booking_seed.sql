-- =====================================================================
-- Propvora demo seed: Marketplace + Booking + Supplier surfaces
-- =====================================================================
-- Idempotent (re-runnable). Every row is tagged for later cleanup:
--   * marketplace_listings / orders / transactions / disputes use
--     metadata->>'seed' = 'true'
--   * other tables use a recognizable id prefix '5eed....' and/or notes.
-- Cleanup later with:  DELETE ... WHERE id::text LIKE '5eed%';
--
-- Attaches to the user's real workspaces:
--   operator  acme  7d9e941b-c6f1-4293-bcbc-76b2197a69bb
--   supplier  JT    2cb94055-8fd2-4807-8f34-9c88e47aa318
--   customer  JT    3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac
--   user            55ce717b-cd55-4e0c-9871-62621e4c95d3
-- Image strategy: real Unsplash CDN URLs for stays/property; category
--   gradient placeholders (gradient: scheme in url) for supplier services.
-- =====================================================================

begin;

-- Reusable workspace + user handles via a temp CTE pattern is awkward in
-- raw SQL, so literal UUIDs are used throughout.

-- ---------------------------------------------------------------------
-- 1. MARKETPLACE LISTINGS  (~26 across listing_type spread)
-- ---------------------------------------------------------------------
insert into marketplace_listings
  (id, workspace_id, company_name, title, description, listing_type, transaction_type,
   category, location_city, location, country_code, region, postcode,
   base_price_pence, price, currency, price_unit, price_period,
   bedrooms, bathrooms, status, visibility, verification_status, verified,
   is_featured, instant_book, request_to_book, rating, review_count,
   view_count, views_count, enquiry_count, enquiries_count, published_at, created_by, metadata)
values
  -- property_stay / serviced accommodation (Unsplash imagery)
  ('5eed0000-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Propvora Stays',
    'Riverside 2-Bed Apartment, Shoreditch','Bright canal-side flat with exposed brick, smart TV and a dedicated workspace. Five minutes from Liverpool Street. Perfect for contractors and city breaks.',
    'property_stay','stay_booking','stays','London','Shoreditch, London','GB','Greater London','E2 7DG',
    1450000,1450,'GBP','night','per_night',2,1,'published','public','verified',true,true,true,true,4.8,32,1280,1280,46,46,now()-interval '40 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"hero":"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"}'),
  ('5eed0000-0000-0000-0001-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Propvora Stays',
    'Luxe 1-Bed Serviced Apartment, Manchester','Hotel-grade serviced accommodation in Spinningfields. Weekly housekeeping, gym access and 24/7 concierge. Ideal for relocations and long stays.',
    'serviced_accommodation','stay_booking','serviced-accom','Manchester','Spinningfields, Manchester','GB','Greater Manchester','M3 3EB',
    980000,980,'GBP','night','per_night',1,1,'published','public','verified',true,true,true,true,4.6,21,742,742,28,28,now()-interval '33 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"hero":"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"}'),
  ('5eed0000-0000-0000-0001-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Propvora Stays',
    'Coastal 3-Bed Holiday Home, Brighton','Pastel townhouse two streets from the seafront. Sleeps six, dog-friendly, with a sun-trap courtyard and outdoor shower.',
    'property_stay','stay_booking','short-let','Brighton','Kemptown, Brighton','GB','East Sussex','BN2 1AS',
    2100000,2100,'GBP','night','per_night',3,2,'published','public','verified',true,true,false,true,4.9,48,1910,1910,71,71,now()-interval '55 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"hero":"https://images.unsplash.com/photo-1568605114967-8130f3a36994"}'),
  ('5eed0000-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Propvora Stays',
    'Modern Studio near Edinburgh Castle','Compact, beautifully finished studio in the Old Town. Walk to Princes Street, Royal Mile and Waverley station.',
    'serviced_accommodation','stay_booking','serviced-accom','Edinburgh','Old Town, Edinburgh','GB','Scotland','EH1 2NG',
    760000,760,'GBP','night','per_night',1,1,'published','public','verified',true,false,true,true,4.5,17,520,520,19,19,now()-interval '21 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"hero":"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"}'),
  ('5eed0000-0000-0000-0001-000000000005','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Propvora Stays',
    'Family 4-Bed House, Leeds Headingley','Spacious Victorian terrace ideal for relocating families. Garden, two reception rooms and off-street parking.',
    'property_stay','stay_booking','short-let','Leeds','Headingley, Leeds','GB','West Yorkshire','LS6 3AA',
    1650000,1650,'GBP','night','per_night',4,2,'published','public','verified',true,false,false,true,4.7,26,634,634,24,24,now()-interval '18 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"hero":"https://images.unsplash.com/photo-1576941089067-2de3c901e126"}'),
  ('5eed0000-0000-0000-0001-000000000006','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Propvora Stays',
    'Penthouse 2-Bed, Bristol Harbourside','Top-floor apartment with floor-to-ceiling glass and a wrap-around balcony over the floating harbour.',
    'serviced_accommodation','stay_booking','serviced-accom','Bristol','Harbourside, Bristol','GB','South West','BS1 5TY',
    1320000,1320,'GBP','night','per_night',2,2,'published','public','verified',true,true,true,true,4.8,39,1102,1102,41,41,now()-interval '12 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"hero":"https://images.unsplash.com/photo-1493809842364-78817add7ffb"}'),
  ('5eed0000-0000-0000-0001-000000000007','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Propvora Stays',
    'City Studio, Birmingham Jewellery Quarter','Industrial-chic studio in a converted factory. Great transport links and independent cafes on the doorstep.',
    'property_stay','stay_booking','short-let','Birmingham','Jewellery Quarter, Birmingham','GB','West Midlands','B1 3PD',
    690000,690,'GBP','night','per_night',1,1,'published','public','unverified',false,false,true,true,4.3,11,318,318,13,13,now()-interval '9 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"hero":"https://images.unsplash.com/photo-1554995207-c18c203602cb"}'),

  -- supplier_service
  ('5eed0000-0000-0000-0002-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'End-of-Tenancy Deep Clean','Full property deep clean including oven, carpets and windows. Photographic before/after report and re-clean guarantee within 72h.',
    'cleaning_turnover','supplier_job','cleaning','London','South & East London','GB','Greater London','SE1',
    18000,180,'GBP','fixed','per_job',null,null,'published','public','verified',true,true,false,true,4.9,54,880,880,63,63,now()-interval '60 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"emerald"}'),
  ('5eed0000-0000-0000-0002-000000000002','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'Gas Safety Certificate (CP12)','Gas Safe registered engineer. Same-week appointments, digital certificate issued on completion, landlord compliance dashboard updated automatically.',
    'compliance_service','service_package','gas-heating','London','Greater London','GB','Greater London','SE1',
    7500,75,'GBP','fixed','per_job',null,null,'published','public','verified',true,true,false,true,4.8,41,612,612,38,38,now()-interval '50 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"amber"}'),
  ('5eed0000-0000-0000-0002-000000000003','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'EICR Electrical Inspection','NICEIC-approved fixed wiring inspection and report for rental properties. Remedial quote provided where required.',
    'compliance_service','service_package','electrical','London','Greater London','GB','Greater London','SE1',
    14500,145,'GBP','fixed','per_job',null,null,'published','public','verified',true,false,true,true,4.7,33,498,498,29,29,now()-interval '44 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"sky"}'),
  ('5eed0000-0000-0000-0002-000000000004','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'Handyman Half-Day','Two hours of general repairs - shelving, leaks, door adjustments, flat-pack and small jobs. Parts billed separately at cost.',
    'maintenance_callout','supplier_job','maintenance','Manchester','Greater Manchester','GB','Greater Manchester','M1',
    9000,90,'GBP','hourly','per_hour',null,null,'published','public','verified',true,true,false,true,4.6,28,344,344,22,22,now()-interval '30 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"violet"}'),
  ('5eed0000-0000-0000-0002-000000000005','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'Turnover Clean & Linen Change','Rapid same-day changeover for short lets - clean, linen, restock and a readiness photo report before the next guest.',
    'cleaning_turnover','supplier_job','cleaning','Birmingham','West Midlands','GB','West Midlands','B1',
    6500,65,'GBP','fixed','per_job',null,null,'published','public','verified',true,true,false,true,4.8,47,701,701,52,52,now()-interval '26 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"teal"}'),
  ('5eed0000-0000-0000-0002-000000000006','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'Boiler Service & Repair','Annual service for combi and system boilers. Pressure check, flue test and parts where needed. Emergency upgrade available.',
    'maintenance_callout','supplier_job','gas-heating','Leeds','West Yorkshire','GB','West Yorkshire','LS1',
    8500,85,'GBP','fixed','per_job',null,null,'published','public','verified',true,false,true,true,4.5,19,256,256,15,15,now()-interval '20 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"rose"}'),

  -- emergency_service
  ('5eed0000-0000-0000-0003-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Emergency Response',
    '24/7 Emergency Plumber','Burst pipes, leaks and blocked drains. Average 60-minute response across central London. Call-out fee plus parts.',
    'emergency_service','emergency_job','emergency','London','Greater London','GB','Greater London','EC1',
    12000,120,'GBP','fixed','per_callout',null,null,'published','public','verified',true,true,false,true,4.7,62,1340,1340,88,88,now()-interval '70 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"red"}'),
  ('5eed0000-0000-0000-0003-000000000002','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Emergency Response',
    '24/7 Emergency Electrician','Power loss, tripping circuits and fault-finding. NICEIC engineers, rapid dispatch and make-safe guarantee.',
    'emergency_service','emergency_job','emergency','Manchester','Greater Manchester','GB','Greater Manchester','M2',
    13500,135,'GBP','fixed','per_callout',null,null,'published','public','verified',true,true,false,true,4.6,38,690,690,47,47,now()-interval '48 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"orange"}'),
  ('5eed0000-0000-0000-0003-000000000003','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Emergency Response',
    'Emergency Locksmith Call-out','Lockouts, broken locks and post-break-in board-ups. Non-destructive entry where possible. 30-minute target response.',
    'emergency_service','emergency_job','emergency','Bristol','South West','GB','South West','BS1',
    9500,95,'GBP','fixed','per_callout',null,null,'published','public','verified',true,true,false,true,4.8,24,402,402,31,31,now()-interval '15 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"slate"}'),

  -- maintenance_callout / cleaning_turnover from a second supplier (operator-listed)
  ('5eed0000-0000-0000-0004-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','BrightSpark Electrical',
    'Fuse Board Upgrade','Consumer unit replacement to current 18th edition regs. Includes certification and minor remedial works.',
    'maintenance_callout','supplier_job','electrical','London','Greater London','GB','Greater London','N1',
    45000,450,'GBP','fixed','per_job',null,null,'published','public','verified',true,false,true,true,4.7,16,210,210,12,12,now()-interval '11 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"indigo"}'),
  ('5eed0000-0000-0000-0004-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','SparkleHomes Cleaning',
    'Weekly Communal Area Clean','Scheduled cleaning of stairwells, lobbies and bin stores for blocks and HMOs. Monthly invoicing and supervisor sign-off.',
    'cleaning_turnover','supplier_job','cleaning','Leeds','West Yorkshire','GB','West Yorkshire','LS2',
    12000,120,'GBP','fixed','per_visit',null,null,'published','public','verified',true,false,false,true,4.5,22,288,288,18,18,now()-interval '8 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"lime"}'),

  -- supplier_package
  ('5eed0000-0000-0000-0005-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'New Tenancy Ready Package','Deep clean, gas & electrical safety checks, smoke alarm test and inventory photos - everything to get a property let-ready in one visit.',
    'supplier_package','service_package','services','London','Greater London','GB','Greater London','SE1',
    39500,395,'GBP','fixed','per_package',null,null,'published','public','verified',true,false,true,true,4.9,29,470,470,34,34,now()-interval '36 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"emerald"}'),
  ('5eed0000-0000-0000-0005-000000000002','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'Annual Compliance Bundle','CP12 gas, EICR electrical, EPC and Legionella risk assessment bundled at a discount with a single renewal reminder.',
    'supplier_package','service_package','compliance-services','Manchester','Greater Manchester','GB','Greater Manchester','M1',
    29000,290,'GBP','fixed','per_package',null,null,'published','public','verified',true,false,true,true,4.8,18,300,300,21,21,now()-interval '24 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"amber"}'),
  ('5eed0000-0000-0000-0005-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Inventory Pros',
    'Professional Inventory & Check-in','Detailed photographic inventory, meter readings and tenant check-in with signed schedule of condition.',
    'supplier_package','service_package','inventory','Birmingham','West Midlands','GB','West Midlands','B2',
    13500,135,'GBP','fixed','per_package',null,null,'published','public','verified',true,false,false,true,4.6,14,196,196,11,11,now()-interval '14 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"cyan"}'),

  -- compliance_service
  ('5eed0000-0000-0000-0006-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'EPC Assessment','Domestic Energy Performance Certificate by an accredited assessor. Lodged with the national register within 24 hours.',
    'compliance_service','service_package','compliance-services','London','Greater London','GB','Greater London','SE1',
    8500,85,'GBP','fixed','per_job',null,null,'published','public','verified',true,true,false,true,4.7,27,360,360,24,24,now()-interval '19 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"green"}'),
  ('5eed0000-0000-0000-0006-000000000002','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'Legionella Risk Assessment','Water system risk assessment for residential lets with a written report and recommended control measures.',
    'compliance_service','service_package','compliance-services','Bristol','South West','GB','South West','BS2',
    9500,95,'GBP','fixed','per_job',null,null,'published','public','verified',true,false,true,true,4.5,12,164,164,9,9,now()-interval '7 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"teal"}'),
  ('5eed0000-0000-0000-0006-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','SafeGuard Fire',
    'Fire Risk Assessment (HMO)','PAS 79 fire risk assessment for HMOs and blocks, including action plan and certificate for licensing.',
    'compliance_service','service_package','compliance-services','Manchester','Greater Manchester','GB','Greater Manchester','M3',
    18500,185,'GBP','fixed','per_job',null,null,'published','public','verified',true,false,true,true,4.8,15,222,222,13,13,now()-interval '5 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"red"}'),

  -- a paused + a draft to show non-published states
  ('5eed0000-0000-0000-0007-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','Propvora Stays',
    'Lake District Cottage (seasonal)','Stone cottage near Windermere, paused out of season. Wood burner, hot tub and fell views.',
    'property_stay','stay_booking','short-let','Windermere','Lake District','GB','Cumbria','LA23 1AX',
    1750000,1750,'GBP','night','per_night',2,1,'paused','public','verified',true,false,false,true,4.9,21,410,410,17,17,now()-interval '90 days','55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"hero":"https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8"}'),
  ('5eed0000-0000-0000-0007-000000000002','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance',
    'Smart Thermostat Install (draft)','Supply and fit of a smart heating control with app setup. Draft listing pending pricing review.',
    'maintenance_callout','supplier_job','gas-heating','London','Greater London','GB','Greater London','SE1',
    19500,195,'GBP','fixed','per_job',null,null,'draft','private','unverified',false,false,false,true,0,0,0,0,0,0,null,'55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"gradient":"violet"}')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. LISTING MEDIA  (Unsplash for stays, gradient pseudo-urls for services)
-- ---------------------------------------------------------------------
insert into marketplace_listing_media (id, listing_id, url, kind, sort_order)
values
  ('5eed0001-0000-0000-0001-000000000001','5eed0000-0000-0000-0001-000000000001','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80','image',0),
  ('5eed0001-0000-0000-0001-000000000002','5eed0000-0000-0000-0001-000000000001','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80','image',1),
  ('5eed0001-0000-0000-0002-000000000001','5eed0000-0000-0000-0001-000000000002','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80','image',0),
  ('5eed0001-0000-0000-0003-000000000001','5eed0000-0000-0000-0001-000000000003','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80','image',0),
  ('5eed0001-0000-0000-0003-000000000002','5eed0000-0000-0000-0001-000000000003','https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&q=80','image',1),
  ('5eed0001-0000-0000-0004-000000000001','5eed0000-0000-0000-0001-000000000004','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80','image',0),
  ('5eed0001-0000-0000-0005-000000000001','5eed0000-0000-0000-0001-000000000005','https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&q=80','image',0),
  ('5eed0001-0000-0000-0006-000000000001','5eed0000-0000-0000-0001-000000000006','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80','image',0),
  ('5eed0001-0000-0000-0007-000000000001','5eed0000-0000-0000-0001-000000000007','https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80','image',0),
  -- supplier service gradient placeholders
  ('5eed0001-0000-0000-0008-000000000001','5eed0000-0000-0000-0002-000000000001','gradient://emerald','gradient',0),
  ('5eed0001-0000-0000-0008-000000000002','5eed0000-0000-0000-0002-000000000002','gradient://amber','gradient',0),
  ('5eed0001-0000-0000-0008-000000000003','5eed0000-0000-0000-0002-000000000003','gradient://sky','gradient',0),
  ('5eed0001-0000-0000-0008-000000000004','5eed0000-0000-0000-0003-000000000001','gradient://red','gradient',0),
  ('5eed0001-0000-0000-0008-000000000005','5eed0000-0000-0000-0005-000000000001','gradient://emerald','gradient',0)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. LISTING CATEGORY LINKS
-- ---------------------------------------------------------------------
insert into marketplace_listing_categories (listing_id, category_slug)
values
  ('5eed0000-0000-0000-0001-000000000001','stays'),
  ('5eed0000-0000-0000-0001-000000000001','short-let'),
  ('5eed0000-0000-0000-0001-000000000002','stays'),
  ('5eed0000-0000-0000-0001-000000000002','serviced-accom'),
  ('5eed0000-0000-0000-0001-000000000003','short-let'),
  ('5eed0000-0000-0000-0001-000000000004','serviced-accom'),
  ('5eed0000-0000-0000-0001-000000000005','short-let'),
  ('5eed0000-0000-0000-0001-000000000006','serviced-accom'),
  ('5eed0000-0000-0000-0001-000000000007','short-let'),
  ('5eed0000-0000-0000-0002-000000000001','cleaning'),
  ('5eed0000-0000-0000-0002-000000000002','gas-heating'),
  ('5eed0000-0000-0000-0002-000000000003','electrical'),
  ('5eed0000-0000-0000-0002-000000000004','maintenance'),
  ('5eed0000-0000-0000-0002-000000000005','cleaning'),
  ('5eed0000-0000-0000-0002-000000000006','gas-heating'),
  ('5eed0000-0000-0000-0003-000000000001','emergency'),
  ('5eed0000-0000-0000-0003-000000000002','emergency'),
  ('5eed0000-0000-0000-0003-000000000003','emergency'),
  ('5eed0000-0000-0000-0004-000000000001','electrical'),
  ('5eed0000-0000-0000-0004-000000000002','cleaning'),
  ('5eed0000-0000-0000-0005-000000000001','services'),
  ('5eed0000-0000-0000-0005-000000000002','compliance-services'),
  ('5eed0000-0000-0000-0005-000000000003','inventory'),
  ('5eed0000-0000-0000-0006-000000000001','compliance-services'),
  ('5eed0000-0000-0000-0006-000000000002','compliance-services'),
  ('5eed0000-0000-0000-0006-000000000003','compliance-services')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 4. LISTING PRICING (a few seasonal / volume rules)
-- ---------------------------------------------------------------------
insert into marketplace_listing_pricing (id, listing_id, rule_type, amount_pence, min_nights, conditions)
values
  ('5eed0002-0000-0000-0001-000000000001','5eed0000-0000-0000-0001-000000000001','weekly',1305000,7,'{"label":"7+ night rate (10% off)"}'),
  ('5eed0002-0000-0000-0001-000000000002','5eed0000-0000-0000-0001-000000000001','monthly',1160000,28,'{"label":"Monthly rate (20% off)"}'),
  ('5eed0002-0000-0000-0003-000000000001','5eed0000-0000-0000-0001-000000000003','peak',2520000,2,'{"label":"Summer peak (Jul-Aug)"}'),
  ('5eed0002-0000-0000-0006-000000000001','5eed0000-0000-0000-0001-000000000006','weekend',1452000,1,'{"label":"Fri/Sat surcharge"}')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 5. LISTING AVAILABILITY (a blocked window on a couple of stays)
-- ---------------------------------------------------------------------
insert into marketplace_listing_availability (id, listing_id, starts_on, ends_on, is_blocked, rule)
values
  ('5eed0003-0000-0000-0003-000000000001','5eed0000-0000-0000-0001-000000000003',current_date+interval '20 days',current_date+interval '27 days',true,'{"reason":"owner_use"}'),
  ('5eed0003-0000-0000-0006-000000000001','5eed0000-0000-0000-0001-000000000006',current_date+interval '5 days',current_date+interval '9 days',true,'{"reason":"maintenance"}')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 6. MARKETPLACE TRANSACTIONS (balanced money) + ORDERS + COMMISSION LEDGER
--    Customer (JT 3a5087ff) buys; seller is operator/supplier.
--    Fee model: 12% platform fee on supplier jobs, 8% on stays.
-- ---------------------------------------------------------------------
insert into marketplace_transactions
  (id, buyer_workspace_id, seller_workspace_id, listing_id, transaction_type,
   gross_pence, platform_fee_pence, provider_fee_pence, seller_payout_pence,
   net_platform_revenue_pence, platform_fee_percent, currency, status, metadata)
values
  -- stay booking, captured (8% fee)
  ('5eed0010-0000-0000-0001-000000000001','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed0000-0000-0000-0001-000000000001','stay_booking',
    4350000,348000,63075,3938925,284925,8.0,'GBP','captured','{"seed":true}'),
  -- serviced accom, released
  ('5eed0010-0000-0000-0001-000000000002','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed0000-0000-0000-0001-000000000002','stay_booking',
    2940000,235200,42630,2662170,192570,8.0,'GBP','released','{"seed":true}'),
  -- supplier job, captured (12% fee)
  ('5eed0010-0000-0000-0002-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0002-000000000001','supplier_job',
    18000,2160,261,15579,1899,12.0,'GBP','captured','{"seed":true}'),
  -- compliance service, captured
  ('5eed0010-0000-0000-0002-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0002-000000000002','service_package',
    7500,900,109,6491,791,12.0,'GBP','captured','{"seed":true}'),
  -- emergency job, authorized (held)
  ('5eed0010-0000-0000-0003-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0003-000000000001','emergency_job',
    12000,1440,174,10386,1266,12.0,'GBP','authorized','{"seed":true}'),
  -- refunded (dispute resolved)
  ('5eed0010-0000-0000-0002-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0002-000000000004','supplier_job',
    9000,1080,131,7789,949,12.0,'GBP','refunded','{"seed":true}')
on conflict (id) do nothing;

insert into marketplace_orders
  (id, workspace_id, buyer_workspace_id, seller_workspace_id, listing_id, transaction_id, transaction_type,
   order_ref, title, description, amount, total_amount, gross_pence, fee_pence, payout_pence, currency, status, start_date, end_date, metadata)
values
  ('5eed0011-0000-0000-0001-000000000001','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed0000-0000-0000-0001-000000000001','5eed0010-0000-0000-0001-000000000001','stay_booking',
    'ORD-STAY-1001','Riverside 2-Bed Apartment, Shoreditch','3-night stay',43500,43500,4350000,348000,3938925,'GBP','completed',current_date-interval '20 days',current_date-interval '17 days','{"seed":true}'),
  ('5eed0011-0000-0000-0001-000000000002','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed0000-0000-0000-0001-000000000002','5eed0010-0000-0000-0001-000000000002','stay_booking',
    'ORD-STAY-1002','Luxe 1-Bed Serviced Apartment, Manchester','3-night stay',29400,29400,2940000,235200,2662170,'GBP','completed',current_date-interval '12 days',current_date-interval '9 days','{"seed":true}'),
  ('5eed0011-0000-0000-0002-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0002-000000000001','5eed0010-0000-0000-0002-000000000001','supplier_job',
    'ORD-JOB-2001','End-of-Tenancy Deep Clean','Flat 4, Shoreditch turnover',180,180,18000,2160,15579,'GBP','completed',current_date-interval '6 days',current_date-interval '6 days','{"seed":true}'),
  ('5eed0011-0000-0000-0002-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0002-000000000002','5eed0010-0000-0000-0002-000000000002','service_package',
    'ORD-JOB-2002','Gas Safety Certificate (CP12)','Annual landlord compliance',75,75,7500,900,6491,'GBP','completed',current_date-interval '3 days',current_date-interval '3 days','{"seed":true}'),
  ('5eed0011-0000-0000-0003-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0003-000000000001','5eed0010-0000-0000-0003-000000000001','emergency_job',
    'ORD-JOB-2003','24/7 Emergency Plumber','Burst pipe make-safe',120,120,12000,1440,10386,'GBP','active',current_date,current_date,'{"seed":true}'),
  ('5eed0011-0000-0000-0002-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0002-000000000004','5eed0010-0000-0000-0002-000000000003','supplier_job',
    'ORD-JOB-2004','Handyman Half-Day','Dispute - work incomplete',90,90,9000,1080,7789,'GBP','refunded',current_date-interval '8 days',current_date-interval '8 days','{"seed":true}')
on conflict (id) do nothing;

-- Commission ledger: balanced rows per captured/released transaction
insert into marketplace_commission_ledger (id, transaction_id, entry_type, amount_pence, currency)
values
  ('5eed0012-0000-0000-0001-000000000001','5eed0010-0000-0000-0001-000000000001','platform_fee',348000,'GBP'),
  ('5eed0012-0000-0000-0001-000000000002','5eed0010-0000-0000-0001-000000000001','provider_fee',63075,'GBP'),
  ('5eed0012-0000-0000-0001-000000000003','5eed0010-0000-0000-0001-000000000001','seller_payout',3938925,'GBP'),
  ('5eed0012-0000-0000-0002-000000000001','5eed0010-0000-0000-0001-000000000002','platform_fee',235200,'GBP'),
  ('5eed0012-0000-0000-0002-000000000002','5eed0010-0000-0000-0001-000000000002','provider_fee',42630,'GBP'),
  ('5eed0012-0000-0000-0002-000000000003','5eed0010-0000-0000-0001-000000000002','seller_payout',2662170,'GBP'),
  ('5eed0012-0000-0000-0003-000000000001','5eed0010-0000-0000-0002-000000000001','platform_fee',2160,'GBP'),
  ('5eed0012-0000-0000-0003-000000000002','5eed0010-0000-0000-0002-000000000001','provider_fee',261,'GBP'),
  ('5eed0012-0000-0000-0003-000000000003','5eed0010-0000-0000-0002-000000000001','seller_payout',15579,'GBP'),
  ('5eed0012-0000-0000-0004-000000000001','5eed0010-0000-0000-0002-000000000002','platform_fee',900,'GBP'),
  ('5eed0012-0000-0000-0004-000000000002','5eed0010-0000-0000-0002-000000000002','seller_payout',6491,'GBP'),
  ('5eed0012-0000-0000-0005-000000000001','5eed0010-0000-0000-0002-000000000003','refund',9000,'GBP')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 7. MARKETPLACE REVIEWS (varied ratings)
-- ---------------------------------------------------------------------
insert into marketplace_reviews
  (id, workspace_id, listing_id, order_id, transaction_id, reviewer_workspace_id, subject_workspace_id,
   review_type, rating, title, body, status, verified)
values
  ('5eed0013-0000-0000-0001-000000000001','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','5eed0000-0000-0000-0001-000000000001','5eed0011-0000-0000-0001-000000000001','5eed0010-0000-0000-0001-000000000001','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','buyer_to_seller',5,'Spotless and central','Exactly as pictured, super clean and the host was responsive. Would book again.','published',true),
  ('5eed0013-0000-0000-0001-000000000002','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','5eed0000-0000-0000-0001-000000000002','5eed0011-0000-0000-0001-000000000002','5eed0010-0000-0000-0001-000000000002','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','buyer_to_seller',4,'Great location, thin walls','Lovely apartment in a brilliant spot. Could hear neighbours a little but overall great value.','published',true),
  ('5eed0013-0000-0000-0002-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed0000-0000-0000-0002-000000000001','5eed0011-0000-0000-0002-000000000001','5eed0010-0000-0000-0002-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','buyer_to_seller',5,'Faultless turnaround','Same-day clean, photo report and the place was immaculate for the next guest.','published',true),
  ('5eed0013-0000-0000-0002-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed0000-0000-0000-0002-000000000002','5eed0011-0000-0000-0002-000000000002','5eed0010-0000-0000-0002-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','buyer_to_seller',5,'Quick and compliant','Booked Monday, certified Wednesday, dashboard updated automatically. Brilliant.','published',true),
  ('5eed0013-0000-0000-0002-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed0000-0000-0000-0002-000000000004','5eed0011-0000-0000-0002-000000000003','5eed0010-0000-0000-0002-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','buyer_to_seller',2,'Did not finish the job','Two of the four tasks were left incomplete. Resolved via refund but disappointing.','published',true),
  ('5eed0013-0000-0000-0002-000000000004','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed0000-0000-0000-0002-000000000001','5eed0011-0000-0000-0002-000000000001','5eed0010-0000-0000-0002-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','seller_to_buyer',5,'Great operator to work with','Clear brief, easy access and prompt payment. Happy to take more jobs.','published',true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 8. MARKETPLACE DISPUTES (a couple)
-- ---------------------------------------------------------------------
insert into marketplace_disputes
  (id, transaction_id, raised_by_workspace_id, against_workspace_id, dispute_type, reason, detail,
   status, priority, amount_disputed_pence, amount_refunded_pence, resolution, resolved_at, workspace_id)
values
  ('5eed0014-0000-0000-0001-000000000001','5eed0010-0000-0000-0002-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','supplier','work_incomplete','Handyman left two tasks undone and departed early. Requesting partial refund.','resolved','normal',9000,9000,'Full refund issued; supplier acknowledged shortfall.',now()-interval '5 days','7d9e941b-c6f1-4293-bcbc-76b2197a69bb'),
  ('5eed0014-0000-0000-0001-000000000002','5eed0010-0000-0000-0003-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','supplier','overcharge','Call-out invoiced higher than quoted; awaiting evidence from supplier.','under_review','high',4000,0,null,null,'7d9e941b-c6f1-4293-bcbc-76b2197a69bb')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 9. SAVED ITEMS + ENQUIRIES (buyer = JT customer)
-- ---------------------------------------------------------------------
insert into marketplace_saved_items (id, workspace_id, listing_id, saved_by, note)
values
  ('5eed0015-0000-0000-0001-000000000001','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','5eed0000-0000-0000-0001-000000000003','55ce717b-cd55-4e0c-9871-62621e4c95d3','Brighton trip in August'),
  ('5eed0015-0000-0000-0001-000000000002','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','5eed0000-0000-0000-0001-000000000006','55ce717b-cd55-4e0c-9871-62621e4c95d3','Bristol - check weekend rates'),
  ('5eed0015-0000-0000-0001-000000000003','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','5eed0000-0000-0000-0001-000000000005',null,'Family relocation shortlist')
on conflict (id) do nothing;

insert into marketplace_enquiries
  (id, listing_id, buyer_workspace_id, buyer_user_id, buyer_name, buyer_email, buyer_phone, message, status, gdpr_consent)
values
  ('5eed0016-0000-0000-0001-000000000001','5eed0000-0000-0000-0001-000000000003','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','55ce717b-cd55-4e0c-9871-62621e4c95d3','Jamahl Thomas','jamahlthomas1996@gmail.com','+447700900111','Is the Brighton house available for the last week of August for 5 guests?','replied',true),
  ('5eed0016-0000-0000-0002-000000000001','5eed0000-0000-0000-0002-000000000002',null,null,'Sarah Okafor','sarah.okafor@example.com','+447700900222','Do you cover SE postcodes for a same-week CP12?','new',true),
  ('5eed0016-0000-0000-0003-000000000001','5eed0000-0000-0000-0003-000000000001',null,null,'Marcus Bell','marcus.bell@example.com',null,'Emergency leak under the sink at a managed flat - are you available tonight?','converted',true)
on conflict (id) do nothing;

-- =====================================================================
-- BOOKING ENGINE
-- =====================================================================
-- ---------------------------------------------------------------------
-- 10. BOOKING LISTINGS  (8, owned by operator acme)
-- ---------------------------------------------------------------------
insert into booking_listings
  (id, workspace_id, listing_type, title, slug, summary, description, status, booking_mode,
   max_guests, bedrooms, beds, bathrooms, amenities, cancellation_policy, country_code, currency,
   timezone, compliance_status, marketplace_listing_id, published_at, created_by)
values
  ('5eedb000-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','entire_home','Riverside 2-Bed Apartment, Shoreditch','riverside-2bed-shoreditch','Canal-side flat, 5 mins from Liverpool St','Bright two-bed with smart TV, fast wifi and a dedicated desk. Self check-in via keypad.','published','instant',4,2,2,1,'["wifi","kitchen","washer","workspace","smart_tv"]','flexible','GB','GBP','Europe/London','passed','5eed0000-0000-0000-0001-000000000001',now()-interval '40 days','55ce717b-cd55-4e0c-9871-62621e4c95d3'),
  ('5eedb000-0000-0000-0001-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','serviced_accommodation','Luxe 1-Bed Serviced Apartment, Manchester','luxe-1bed-manchester','Spinningfields, concierge & gym','Hotel-grade serviced apartment with weekly housekeeping and 24/7 concierge.','published','instant',2,1,1,1,'["wifi","kitchen","gym","concierge","housekeeping"]','moderate','GB','GBP','Europe/London','passed','5eed0000-0000-0000-0001-000000000002',now()-interval '33 days','55ce717b-cd55-4e0c-9871-62621e4c95d3'),
  ('5eedb000-0000-0000-0001-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','entire_home','Coastal 3-Bed Holiday Home, Brighton','coastal-3bed-brighton','Two streets from the seafront, dog-friendly','Pastel townhouse sleeping six with a sun-trap courtyard and outdoor shower.','published','request',6,3,4,2,'["wifi","kitchen","garden","pet_friendly","parking"]','strict','GB','GBP','Europe/London','passed','5eed0000-0000-0000-0001-000000000003',now()-interval '55 days','55ce717b-cd55-4e0c-9871-62621e4c95d3'),
  ('5eedb000-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','serviced_accommodation','Modern Studio near Edinburgh Castle','modern-studio-edinburgh','Old Town, walk to the Royal Mile','Compact, beautifully finished studio steps from Waverley station.','published','instant',2,1,1,1,'["wifi","kitchen","heating"]','flexible','GB','GBP','Europe/London','passed','5eed0000-0000-0000-0001-000000000004',now()-interval '21 days','55ce717b-cd55-4e0c-9871-62621e4c95d3'),
  ('5eedb000-0000-0000-0001-000000000005','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','entire_home','Family 4-Bed House, Leeds Headingley','family-4bed-leeds','Victorian terrace, garden & parking','Spacious family home ideal for relocations, with two reception rooms.','published','request',7,4,5,2,'["wifi","kitchen","garden","parking","washer"]','moderate','GB','GBP','Europe/London','passed','5eed0000-0000-0000-0001-000000000005',now()-interval '18 days','55ce717b-cd55-4e0c-9871-62621e4c95d3'),
  ('5eedb000-0000-0000-0001-000000000006','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','serviced_accommodation','Penthouse 2-Bed, Bristol Harbourside','penthouse-2bed-bristol','Floor-to-ceiling glass over the harbour','Top-floor apartment with a wrap-around balcony and harbour views.','published','instant',4,2,2,2,'["wifi","kitchen","balcony","dishwasher","lift"]','moderate','GB','GBP','Europe/London','passed','5eed0000-0000-0000-0001-000000000006',now()-interval '12 days','55ce717b-cd55-4e0c-9871-62621e4c95d3'),
  ('5eedb000-0000-0000-0001-000000000007','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','private_room','En-suite Room, Birmingham JQ','ensuite-room-birmingham','Private room in a converted factory loft','Private en-suite room with shared kitchen in a stylish loft conversion.','published','instant',2,1,1,1,'["wifi","kitchen","heating","desk"]','flexible','GB','GBP','Europe/London','passed',null,now()-interval '9 days','55ce717b-cd55-4e0c-9871-62621e4c95d3'),
  ('5eedb000-0000-0000-0001-000000000008','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','entire_home','Lake District Cottage (seasonal)','lake-district-cottage','Stone cottage near Windermere','Wood burner, hot tub and fell views. Paused out of season.','paused','request',4,2,3,1,'["wifi","kitchen","hot_tub","fireplace","parking"]','strict','GB','GBP','Europe/London','passed','5eed0000-0000-0000-0007-000000000001',now()-interval '90 days','55ce717b-cd55-4e0c-9871-62621e4c95d3')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 11. BOOKING PHOTOS (Unsplash)
-- ---------------------------------------------------------------------
insert into booking_listing_photos (id, listing_id, url, caption, room_tag, sort_order, is_cover)
values
  ('5eedb001-0000-0000-0001-000000000001','5eedb000-0000-0000-0001-000000000001','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80','Living room','living',0,true),
  ('5eedb001-0000-0000-0001-000000000002','5eedb000-0000-0000-0001-000000000001','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80','Bedroom','bedroom',1,false),
  ('5eedb001-0000-0000-0002-000000000001','5eedb000-0000-0000-0001-000000000002','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80','Open-plan living','living',0,true),
  ('5eedb001-0000-0000-0003-000000000001','5eedb000-0000-0000-0001-000000000003','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80','Exterior','exterior',0,true),
  ('5eedb001-0000-0000-0003-000000000002','5eedb000-0000-0000-0001-000000000003','https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&q=80','Courtyard','garden',1,false),
  ('5eedb001-0000-0000-0004-000000000001','5eedb000-0000-0000-0001-000000000004','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80','Studio','living',0,true),
  ('5eedb001-0000-0000-0005-000000000001','5eedb000-0000-0000-0001-000000000005','https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&q=80','Family home','exterior',0,true),
  ('5eedb001-0000-0000-0006-000000000001','5eedb000-0000-0000-0001-000000000006','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80','Penthouse','living',0,true),
  ('5eedb001-0000-0000-0007-000000000001','5eedb000-0000-0000-0001-000000000007','https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80','En-suite room','bedroom',0,true),
  ('5eedb001-0000-0000-0008-000000000001','5eedb000-0000-0000-0001-000000000008','https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80','Cottage','exterior',0,true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 12. PRICING PROFILES + PRICE RULES
-- ---------------------------------------------------------------------
insert into booking_pricing_profiles
  (id, workspace_id, listing_id, name, base_nightly_pence, weekend_pence, weekly_discount_pct, monthly_discount_pct,
   min_nights, cleaning_fee_pence, extra_guest_fee_pence, extra_guest_after, security_deposit_pence)
values
  ('5eedb002-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eedb000-0000-0000-0001-000000000001','Shoreditch standard',1450000,1595000,10,20,2,8000,2500,2,20000),
  ('5eedb002-0000-0000-0001-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eedb000-0000-0000-0001-000000000002','Manchester serviced',980000,1078000,12,25,2,6000,2000,2,15000),
  ('5eedb002-0000-0000-0001-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eedb000-0000-0000-0001-000000000003','Brighton coastal',2100000,2520000,8,15,3,12000,3000,4,30000),
  ('5eedb002-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eedb000-0000-0000-0001-000000000004','Edinburgh studio',760000,836000,10,20,1,5000,0,2,10000),
  ('5eedb002-0000-0000-0001-000000000005','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eedb000-0000-0000-0001-000000000005','Leeds family',1650000,1815000,10,22,2,9000,2500,4,25000),
  ('5eedb002-0000-0000-0001-000000000006','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eedb000-0000-0000-0001-000000000006','Bristol penthouse',1320000,1452000,10,20,2,8500,2500,2,20000)
on conflict (id) do nothing;

insert into booking_price_rules
  (id, listing_id, pricing_profile_id, name, rule_type, date_from, date_to, adjust_kind, adjust_value, priority)
values
  ('5eedb003-0000-0000-0001-000000000001','5eedb000-0000-0000-0001-000000000003','5eedb002-0000-0000-0001-000000000003','Summer peak','seasonal',date_trunc('year',current_date)+interval '6 months',date_trunc('year',current_date)+interval '8 months',  'pct',20,10),
  ('5eedb003-0000-0000-0001-000000000002','5eedb000-0000-0000-0001-000000000001','5eedb002-0000-0000-0001-000000000001','Last-minute deal','last_minute',null,null,'pct',-10,20),
  ('5eedb003-0000-0000-0001-000000000003','5eedb000-0000-0000-0001-000000000006','5eedb002-0000-0000-0001-000000000006','Early bird','early_bird',null,null,'pct',-8,30)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 13. AVAILABILITY DAYS (next 90 days per published listing; some booked/blocked)
--    Generated; deterministic ids would be unwieldy, so guard on (listing_id,date).
-- ---------------------------------------------------------------------
insert into booking_availability_days (listing_id, date, status, price_override_pence)
select l.id, d::date,
  case
    when d::date between current_date+7 and current_date+10 then 'booked_direct'
    when d::date between current_date+20 and current_date+22 then 'blocked_maintenance'
    else 'available'
  end,
  case when extract(dow from d) in (5,6) then 110000::bigint else null::bigint end
from booking_listings l
cross join generate_series(current_date, current_date+89, interval '1 day') d
where l.id::text like '5eedb000%' and l.status='published'
on conflict (listing_id, date) do nothing;

-- ---------------------------------------------------------------------
-- 14. BOOKINGS  (~13 across statuses; some linked to JT Customer Workspace)
-- ---------------------------------------------------------------------
insert into bookings
  (id, booking_listing_id, workspace_id, customer_workspace_id, guest_name, guest_email, guest_phone,
   check_in, check_out, nights, guests_count, currency, subtotal_pence, fees_pence, total_pence, deposit_pence,
   platform_fee_pence, status, payment_status, source, booking_ref, transaction_id, guest_message, created_at)
values
  -- completed past stays for JT customer (so My Bookings shows history)
  ('5eedb010-0000-0000-0001-000000000001','5eedb000-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','Jamahl Thomas','jamahlthomas1996@gmail.com','+447700900111',current_date-20,current_date-17,3,2,'GBP',4350000,8000,4358000,20000,348000,'completed','paid','direct','BK-1001','5eed0010-0000-0000-0001-000000000001','Quiet check-in please',now()-interval '25 days'),
  ('5eedb010-0000-0000-0001-000000000002','5eedb000-0000-0000-0001-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','Jamahl Thomas','jamahlthomas1996@gmail.com','+447700900111',current_date-12,current_date-9,3,1,'GBP',2940000,6000,2946000,15000,235200,'completed','paid','direct','BK-1002','5eed0010-0000-0000-0001-000000000002','Late arrival approx 9pm',now()-interval '15 days'),
  -- upcoming confirmed for JT customer
  ('5eedb010-0000-0000-0001-000000000003','5eedb000-0000-0000-0001-000000000006','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','Jamahl Thomas','jamahlthomas1996@gmail.com','+447700900111',current_date+14,current_date+17,3,2,'GBP',3960000,8500,3968500,20000,316800,'confirmed','deposit_paid','direct','BK-1003',null,'Anniversary trip',now()-interval '4 days'),
  -- checked_in (current guest)
  ('5eedb010-0000-0000-0001-000000000004','5eedb000-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'Priya Sharma','priya.sharma@example.com','+447700900333',current_date-1,current_date+2,3,1,'GBP',2280000,5000,2285000,10000,182400,'checked_in','paid','airbnb','BK-1004',null,null,now()-interval '6 days'),
  -- pending payment
  ('5eedb010-0000-0000-0001-000000000005','5eedb000-0000-0000-0001-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'Tom & Rachel Hughes','hughes.family@example.com','+447700900444',current_date+30,current_date+35,5,5,'GBP',10500000,12000,10512000,30000,840000,'pending_payment','unpaid','direct','BK-1005',null,'Travelling with a dog',now()-interval '1 day'),
  -- hold (cart in progress)
  ('5eedb010-0000-0000-0001-000000000006','5eedb000-0000-0000-0001-000000000005','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'Daniel Osei','daniel.osei@example.com',null,current_date+45,current_date+52,7,6,'GBP',11550000,9000,11559000,25000,924000,'hold','unpaid','direct','BK-1006',null,null,now()-interval '2 hours'),
  -- cancelled
  ('5eedb010-0000-0000-0001-000000000007','5eedb000-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'Elena Petrova','elena.petrova@example.com','+447700900555',current_date-5,current_date-2,3,2,'GBP',4350000,8000,4358000,20000,348000,'cancelled','refunded','booking_com','BK-1007',null,'Plans changed',now()-interval '18 days'),
  -- more confirmed across listings
  ('5eedb010-0000-0000-0001-000000000008','5eedb000-0000-0000-0001-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'Liam Carter','liam.carter@example.com','+447700900666',current_date+5,current_date+8,3,2,'GBP',2940000,6000,2946000,15000,235200,'confirmed','paid','direct','BK-1008',null,null,now()-interval '3 days'),
  ('5eedb010-0000-0000-0001-000000000009','5eedb000-0000-0000-0001-000000000005','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'Aisha Khan','aisha.khan@example.com','+447700900777',current_date+10,current_date+17,7,4,'GBP',11550000,9000,11559000,25000,924000,'confirmed','deposit_paid','direct','BK-1009',null,'Relocating for work',now()-interval '5 days'),
  ('5eedb010-0000-0000-0001-000000000010','5eedb000-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'George Wright','george.wright@example.com',null,current_date+2,current_date+4,2,1,'GBP',1520000,5000,1525000,10000,121600,'confirmed','paid','airbnb','BK-1010',null,null,now()-interval '2 days'),
  -- checked_out (awaiting review)
  ('5eedb010-0000-0000-0001-000000000011','5eedb000-0000-0000-0001-000000000006','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'Nadia Hassan','nadia.hassan@example.com','+447700900888',current_date-4,current_date-1,3,2,'GBP',3960000,8500,3968500,20000,316800,'checked_out','paid','direct','BK-1011',null,null,now()-interval '8 days'),
  -- no_show
  ('5eedb010-0000-0000-0001-000000000012','5eedb000-0000-0000-0001-000000000007','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',null,'Chris Anderson','chris.anderson@example.com',null,current_date-3,current_date-1,2,1,'GBP',1100000,4000,1104000,5000,88000,'no_show','paid','booking_com','BK-1012',null,null,now()-interval '10 days'),
  -- another completed for JT customer
  ('5eedb010-0000-0000-0001-000000000013','5eedb000-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','Jamahl Thomas','jamahlthomas1996@gmail.com','+447700900111',current_date-40,current_date-37,3,1,'GBP',2280000,5000,2285000,10000,182400,'completed','paid','direct','BK-1013',null,'Great little base for the festival',now()-interval '45 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 15. LEGAL ACCEPTANCES (one per confirmed/paid booking)
-- ---------------------------------------------------------------------
insert into booking_legal_acceptances (id, booking_id, workspace_id, document_type, document_version, accepted, snapshot, ip)
values
  ('5eedb011-0000-0000-0001-000000000001','5eedb010-0000-0000-0001-000000000001','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','guest_terms','v1.2',true,'{"seed":true,"title":"Guest Booking Terms"}','203.0.113.10'),
  ('5eedb011-0000-0000-0001-000000000002','5eedb010-0000-0000-0001-000000000001','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','house_rules','v1.0',true,'{"seed":true,"title":"House Rules"}','203.0.113.10'),
  ('5eedb011-0000-0000-0001-000000000003','5eedb010-0000-0000-0001-000000000003','3a5087ff-49ff-41f2-89bc-5b58bfb5d8ac','guest_terms','v1.2',true,'{"seed":true,"title":"Guest Booking Terms"}','203.0.113.11'),
  ('5eedb011-0000-0000-0001-000000000004','5eedb010-0000-0000-0001-000000000008',null,'guest_terms','v1.2',true,'{"seed":true,"title":"Guest Booking Terms"}','203.0.113.12'),
  ('5eedb011-0000-0000-0001-000000000005','5eedb010-0000-0000-0001-000000000009',null,'cancellation_policy','v1.1',true,'{"seed":true,"title":"Cancellation Policy"}','203.0.113.13')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 16. BOOKING REVIEWS + ISSUES
-- ---------------------------------------------------------------------
insert into booking_reviews (id, booking_id, listing_id, workspace_id, rating, title, body)
values
  ('5eedb012-0000-0000-0001-000000000001','5eedb010-0000-0000-0001-000000000001','5eedb000-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',5,'Perfect city base','Immaculate, well located and the keypad entry was seamless.'),
  ('5eedb012-0000-0000-0001-000000000002','5eedb010-0000-0000-0001-000000000002','5eedb000-0000-0000-0001-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',4,'Comfortable and central','Lovely apartment, concierge was helpful. Slightly noisy at night.'),
  ('5eedb012-0000-0000-0001-000000000003','5eedb010-0000-0000-0001-000000000013','5eedb000-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb',5,'Ideal festival spot','Tiny but perfectly formed, exactly where you want to be.')
on conflict (id) do nothing;

insert into booking_issues (id, booking_id, workspace_id, category, severity, subject, detail, status, reported_by)
values
  ('5eedb013-0000-0000-0001-000000000001','5eedb010-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','maintenance','normal','Shower running cold','Guest reports the shower is not heating properly on day one.','acknowledged','guest'),
  ('5eedb013-0000-0000-0001-000000000002','5eedb010-0000-0000-0001-000000000011','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','cleanliness','low','Minor cleaning miss','Bins not emptied before arrival; resolved same day.','resolved','guest')
on conflict (id) do nothing;

-- =====================================================================
-- SUPPLIER WORKSPACE  (JT Supplier Workspace 2cb94055)
-- =====================================================================
-- ---------------------------------------------------------------------
-- 17. SUPPLIER WORKSPACE PROFILE / SERVICES / PACKAGES
-- ---------------------------------------------------------------------
insert into supplier_workspace_profiles
  (workspace_id, display_name, bio, trades, years_experience, insurance_verified, public_liability_cover_pence,
   service_radius_km, base_location, response_time_hours, accepts_emergency, status)
values
  ('2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance','Multi-trade maintenance and compliance team covering London and the South East. Gas Safe, NICEIC and DBS-checked engineers with full insurance.','{"cleaning","plumbing","electrical","gas","handyman"}',12,true,500000000,40,'London SE1',2,true,'active')
on conflict (workspace_id) do update set
  display_name=excluded.display_name, bio=excluded.bio, trades=excluded.trades,
  years_experience=excluded.years_experience, insurance_verified=excluded.insurance_verified,
  public_liability_cover_pence=excluded.public_liability_cover_pence, service_radius_km=excluded.service_radius_km,
  base_location=excluded.base_location, response_time_hours=excluded.response_time_hours,
  accepts_emergency=excluded.accepts_emergency, status=excluded.status, updated_at=now();

insert into supplier_workspace_services
  (id, workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence, active)
values
  ('5eed5000-0000-0000-0001-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','End-of-Tenancy Deep Clean','cleaning','Full property deep clean with photographic report.','fixed',18000,null,true),
  ('5eed5000-0000-0000-0001-000000000002','2cb94055-8fd2-4807-8f34-9c88e47aa318','Gas Safety Certificate (CP12)','gas','Gas Safe certified annual inspection.','fixed',7500,null,true),
  ('5eed5000-0000-0000-0001-000000000003','2cb94055-8fd2-4807-8f34-9c88e47aa318','EICR Electrical Inspection','electrical','NICEIC fixed-wiring inspection and report.','fixed',14500,null,true),
  ('5eed5000-0000-0000-0001-000000000004','2cb94055-8fd2-4807-8f34-9c88e47aa318','Handyman','handyman','General repairs charged hourly.','hourly',4500,3000,true),
  ('5eed5000-0000-0000-0001-000000000005','2cb94055-8fd2-4807-8f34-9c88e47aa318','24/7 Emergency Plumbing','plumbing','Out-of-hours leaks and bursts.','quote_required',null,12000,true)
on conflict (id) do nothing;

insert into supplier_workspace_packages
  (id, workspace_id, name, description, price_pence, duration_days, inclusions, exclusions, active)
values
  ('5eed5001-0000-0000-0001-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','New Tenancy Ready','Get a property let-ready in one visit.',39500,1,'{"Deep clean","CP12 gas check","EICR electrical","Smoke alarm test","Inventory photos"}','{"Remedial works","Parts over £50"}',true),
  ('5eed5001-0000-0000-0001-000000000002','2cb94055-8fd2-4807-8f34-9c88e47aa318','Annual Compliance Bundle','All statutory checks bundled with one renewal reminder.',29000,1,'{"CP12 gas","EICR electrical","EPC","Legionella risk assessment"}','{"Remedial works"}',true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 18. SUPPLIER JOB ASSIGNMENTS (across states) - operator acme -> JT supplier
-- ---------------------------------------------------------------------
insert into supplier_job_assignments
  (id, operator_workspace_id, supplier_workspace_id, status, scheduled_for, completed_at, created_at)
values
  ('5eed5010-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','completed',now()-interval '6 days',now()-interval '6 days',now()-interval '8 days'),
  ('5eed5010-0000-0000-0001-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','completed',now()-interval '3 days',now()-interval '3 days',now()-interval '5 days'),
  ('5eed5010-0000-0000-0001-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','in_progress',now(),null,now()-interval '1 day'),
  ('5eed5010-0000-0000-0001-000000000004','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','accepted',now()+interval '2 days',null,now()-interval '12 hours'),
  ('5eed5010-0000-0000-0001-000000000005','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','assigned',now()+interval '4 days',null,now()-interval '3 hours'),
  ('5eed5010-0000-0000-0001-000000000006','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','2cb94055-8fd2-4807-8f34-9c88e47aa318','cancelled',now()-interval '1 day',null,now()-interval '4 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 19. SUPPLIER WORKSPACE INVOICES (across statuses)
-- ---------------------------------------------------------------------
insert into supplier_workspace_invoices
  (id, workspace_id, assignment_id, invoice_number, amount_pence, currency, status, submitted_at, approved_at, paid_at, notes)
values
  ('5eed5020-0000-0000-0001-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed5010-0000-0000-0001-000000000001','INV-2026-0001',18000,'GBP','paid',now()-interval '6 days',now()-interval '5 days',now()-interval '4 days','End-of-tenancy clean, Shoreditch'),
  ('5eed5020-0000-0000-0001-000000000002','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed5010-0000-0000-0001-000000000002','INV-2026-0002',7500,'GBP','approved',now()-interval '3 days',now()-interval '2 days',null,'CP12 gas certificate'),
  ('5eed5020-0000-0000-0001-000000000003','2cb94055-8fd2-4807-8f34-9c88e47aa318','5eed5010-0000-0000-0001-000000000003','INV-2026-0003',9000,'GBP','submitted',now()-interval '12 hours',null,null,'Handyman half-day - in progress'),
  ('5eed5020-0000-0000-0001-000000000004','2cb94055-8fd2-4807-8f34-9c88e47aa318',null,'INV-2026-0004',14500,'GBP','draft',null,null,null,'EICR - awaiting completion')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 20. SUPPLIER DIRECTORY ENTRY + REVIEWS (operator's view of the supplier)
-- ---------------------------------------------------------------------
insert into supplier_directory
  (id, workspace_id, name, trading_name, email, phone, address_city, address_postcode, description,
   specialisms, service_areas, status, is_preferred, is_verified, avg_rating, review_count, created_by, metadata)
values
  ('5eed5030-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','JT Trades & Maintenance','JT Trades','hello@jttrades.example.com','+442079460111','London','SE1','Trusted multi-trade partner for cleaning, gas, electrical and emergency works.','{"cleaning","gas","electrical","plumbing"}','{"London","South East"}','active',true,true,4.8,3,'55ce717b-cd55-4e0c-9871-62621e4c95d3','{"seed":true,"supplier_workspace_id":"2cb94055-8fd2-4807-8f34-9c88e47aa318"}')
on conflict (id) do nothing;

insert into supplier_reviews
  (id, workspace_id, supplier_id, rating, title, body, reviewer_id, reviewer_name, job_type, verified)
values
  ('5eed5031-0000-0000-0001-000000000001','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed5030-0000-0000-0001-000000000001',5,'Reliable and tidy','Turned up on time, clear pricing and left the place spotless.','55ce717b-cd55-4e0c-9871-62621e4c95d3','Premier Property Management','cleaning',true),
  ('5eed5031-0000-0000-0001-000000000002','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed5030-0000-0000-0001-000000000001',5,'Sorted our compliance backlog','Booked CP12s across six units in a week. Excellent comms.','55ce717b-cd55-4e0c-9871-62621e4c95d3','Premier Property Management','gas',true),
  ('5eed5031-0000-0000-0001-000000000003','7d9e941b-c6f1-4293-bcbc-76b2197a69bb','5eed5030-0000-0000-0001-000000000001',4,'Good but ran slightly late','Quality work, just arrived 30 mins outside the window.','55ce717b-cd55-4e0c-9871-62621e4c95d3','Premier Property Management','electrical',true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 21. SUPPLIER VERIFICATION at L3 (identity verif -> business verif + badges)
-- ---------------------------------------------------------------------
insert into supplier_identity_verifications
  (id, supplier_workspace_id, user_id, verification_level, status, provider,
   document_check_status, selfie_check_status, manual_review_status, verified_at)
values
  ('5eed5040-0000-0000-0001-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','55ce717b-cd55-4e0c-9871-62621e4c95d3',3,'verified','manual','passed','passed','approved',now()-interval '20 days')
on conflict (id) do nothing;

insert into supplier_business_verifications
  (id, verification_id, supplier_workspace_id, legal_name, business_type, registration_country,
   company_number_masked, vat_number_masked, registered_address, status, notes)
values
  ('5eed5041-0000-0000-0001-000000000001','5eed5040-0000-0000-0001-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','JT Trades & Maintenance Ltd','limited_company','GB','****6166','GB****1234','1 Trinity Street, London SE1','accepted','Companies House verified')
on conflict (id) do nothing;

insert into supplier_verification_badges
  (id, verification_id, supplier_workspace_id, badge_key, label, active, granted_at)
values
  ('5eed5042-0000-0000-0001-000000000001','5eed5040-0000-0000-0001-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','identity_verified','Identity verified',true,now()-interval '20 days'),
  ('5eed5042-0000-0000-0001-000000000002','5eed5040-0000-0000-0001-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','business_verified','Business verified',true,now()-interval '19 days'),
  ('5eed5042-0000-0000-0001-000000000003','5eed5040-0000-0000-0001-000000000001','2cb94055-8fd2-4807-8f34-9c88e47aa318','insured','Insured (£5m PL)',true,now()-interval '18 days')
on conflict (id) do nothing;

commit;
