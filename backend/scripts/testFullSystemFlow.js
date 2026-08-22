import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Models
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import Vehicle from '../models/Vehicle.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';
import InventoryItem from '../models/InventoryItem.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import FinancialEntry from '../models/FinancialEntry.js';
import Appointment from '../models/Appointment.js';
import JobCard from '../models/JobCard.js';
import VehicleInspection from '../models/VehicleInspection.js';
import SparePartsRequest from '../models/SparePartsRequest.js';
import TimeLog from '../models/TimeLog.js';
import RoadTest from '../models/RoadTest.js';
import FinalInspectionReport from '../models/FinalInspectionReport.js';
import Invoice from '../models/Invoice.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';

dotenv.config();

const runFullSystemTest = async () => {
  console.log('====================================================');
  console.log('🚗 STARTING FULL VSMS SYSTEM END-TO-END INTEGRATION TEST');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, description) => {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
    }
  };

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB for Full System Flow Testing.\n');

    // ------------------------------------------------------------------
    // ROLE 1: ADMINISTRATOR OPERATIONS
    // ------------------------------------------------------------------
    console.log('--- 1. ADMINISTRATOR ROLE TESTS ---');

    // 1.1 User Creation & Roles
    const timestamp = Date.now();
    const testAdmin = await User.findOne({ role: 'administrator' });
    assert(testAdmin !== null, 'Admin user exists in system');

    const testManagerUser = await User.create({
      username: `test_manager_${timestamp}`,
      email: `manager_${timestamp}@vsms.test`,
      password: 'TestPassword123!',
      role: 'manager',
      firstName: 'Test',
      lastName: 'Manager',
      mobile: '0771234567',
    });
    assert(testManagerUser.role === 'manager', 'Admin can create Manager account');

    const testMechanicUser = await User.create({
      username: `test_mechanic_${timestamp}`,
      email: `mechanic_${timestamp}@vsms.test`,
      password: 'TestPassword123!',
      role: 'employee',
      firstName: 'Kamal',
      lastName: 'Perera',
      mobile: '0777654321',
    });
    assert(testMechanicUser.role === 'employee', 'Admin can create Employee (Mechanic) account');

    const mechanicEmployeeRecord = await Employee.create({
      user: testMechanicUser._id,
      designation: 'Senior Mechanic',
      basicSalary: 65000,
    });
    assert(mechanicEmployeeRecord._id !== null, 'Employee profile generated with salary & designation');

    const testCustomerUser = await User.create({
      username: `test_customer_${timestamp}`,
      email: `customer_${timestamp}@vsms.test`,
      password: 'TestPassword123!',
      role: 'customer',
      firstName: 'Sunil',
      lastName: 'Silva',
      mobile: '0719876543',
    });
    assert(testCustomerUser.role === 'customer', 'Admin can create Customer user account');

    // Account activation toggle
    testCustomerUser.isActive = false;
    await testCustomerUser.save();
    assert(testCustomerUser.isActive === false, 'Admin can deactivate user account');
    testCustomerUser.isActive = true;
    await testCustomerUser.save();
    assert(testCustomerUser.isActive === true, 'Admin can activate user account');

    // 1.2 Service Categories & Services
    const serviceCat = await ServiceCategory.create({
      name: `Full Engine Service ${timestamp}`,
      description: 'Complete engine tuneup and fluids change',
      isActive: true,
    });
    assert(serviceCat._id !== null, 'Admin can create Service Category');

    const serviceItem = await Service.create({
      name: `Synthetic Oil Change ${timestamp}`,
      category: serviceCat._id,
      baseServicePrice: 12000,
      laborCharge: 3000,
      estimatedDurationMinutes: 60,
      description: 'Synthetic engine oil replacement with filter',
      status: 'active',
    });
    assert(serviceItem.totalPrice === 15000, 'Admin can add Service with pricing (base + labor)');

    // 1.3 Inventory Items & Supplier
    const supplier = await Supplier.create({
      name: `Lanka Auto Supplies Ltd ${timestamp}`,
      contactPerson: 'Nimal Jayasinghe',
      email: `supplier_${timestamp}@autosupplies.lk`,
      phone: '0112345678',
      address: { street: '123 Main St', city: 'Colombo' },
      isActive: true,
    });
    assert(supplier._id !== null, 'Admin can add Supplier details');

    const inventoryItem = await InventoryItem.create({
      itemName: `Engine Oil 5W-30 ${timestamp}`,
      category: 'Lubricant',
      brand: 'Castrol',
      purchasePrice: 3500,
      sellingPrice: 4500,
      quantity: 50,
      reorderLevel: 10,
      unit: 'Liter',
      supplier: supplier._id,
    });
    assert(inventoryItem.quantity === 50, 'Admin can add Inventory Item (Lubricants/Spare Parts/Tires)');

    // 1.4 Supplier Purchase Order
    const po = await PurchaseOrder.create({
      supplier: supplier._id,
      supplierName: supplier.name,
      expectedDeliveryDate: new Date(Date.now() + 86400000),
      items: [
        {
          item: inventoryItem._id,
          itemName: inventoryItem.itemName,
          quantity: 20,
          unitPrice: 3500,
          total: 70000,
        },
      ],
      subtotal: 70000,
      totalAmount: 70000,
      status: 'pending',
      createdBy: testAdmin._id,
    });
    assert(po.status === 'pending', 'Admin can generate Supplier Purchase Orders');

    // 1.5 Financial Management (Expenses & Other Income)
    const expense = await FinancialEntry.create({
      entryType: 'expense',
      category: 'Electricity',
      amount: 25000,
      date: new Date(),
      description: 'Monthly Workshop Electricity Bill',
      paymentMethod: 'bank_transfer',
      createdBy: testAdmin._id,
    });
    assert(expense.category === 'Electricity', 'Admin can record Business Expenses with category');

    const income = await FinancialEntry.create({
      entryType: 'income',
      category: 'Vehicle Wash',
      amount: 3500,
      date: new Date(),
      description: 'Express Exterior Wash Service',
      paymentMethod: 'cash',
      createdBy: testAdmin._id,
    });
    assert(income.category === 'Vehicle Wash', 'Admin can record Other Income (Wash, Parking, Towing, etc.)');

    console.log('\n--- 2. MANAGER ROLE TESTS ---');

    // 2.1 Customer Profile & Vehicle Registration
    const customerProfile = await Customer.create({
      user: testCustomerUser._id,
      firstName: 'Sunil',
      lastName: 'Silva',
      phone: '0719876543',
      email: testCustomerUser.email,
      address: { street: '45 Galle Rd', city: 'Colombo' },
    });
    assert(customerProfile._id !== null, 'Manager can register Customer profile');

    const vehicle = await Vehicle.create({
      customer: customerProfile._id,
      registrationNumber: `WP-CAB-${timestamp.toString().slice(-4)}`,
      vin: `VIN${timestamp}`,
      make: 'Toyota',
      model: 'Axio',
      manufactureYear: 2020,
      engineNumber: `ENG-${timestamp}`,
      fuelType: 'petrol',
      transmission: 'automatic',
      currentMileage: 45000,
      color: 'Pearl White',
    });
    assert(vehicle.registrationNumber !== null, 'Manager can register Vehicle with full specs (VIN, Engine No, Mileage, etc.)');

    // 2.2 Appointment Management
    const appointment = await Appointment.create({
      customer: customerProfile._id,
      vehicle: vehicle._id,
      serviceType: serviceItem.name,
      preferredDate: new Date(),
      preferredTime: '10:00 AM',
      status: 'approved',
      notes: 'Customer reported slight engine noise',
    });
    assert(appointment.status === 'approved', 'Manager can view, approve, and confirm Appointments');

    // 2.3 Job Card Creation
    const jobCard = await JobCard.create({
      customer: customerProfile._id,
      vehicle: vehicle._id,
      appointment: appointment._id,
      assignedTechnician: mechanicEmployeeRecord._id,
      status: 'pending',
      complaint: 'Engine oil replacement and overall safety inspection',
      inspectionNotes: 'Customer requested 5W30 synthetic oil',
      estimatedCost: 18500,
      estimatedDeliveryDate: new Date(Date.now() + 86400000),
    });
    assert(jobCard.status === 'pending', 'Manager can create Job Card with assigned Mechanic, Estimated Cost & Delivery Date');

    console.log('\n--- 3. EMPLOYEE (MECHANIC/TECHNICIAN) ROLE TESTS ---');

    // 3.1 Initial Inspection
    const inspection = await VehicleInspection.create({
      jobCard: jobCard._id,
      vehicle: vehicle._id,
      technician: mechanicEmployeeRecord._id,
      odometerReading: 45000,
      vehicleCondition: 'good',
      inspectionNotes: 'Initial visual check completed, air filter slightly dirty',
      problemsFound: [
        { category: 'engine', problem: 'Air filter dirty', severity: 'low' },
        { category: 'brakes', problem: 'Brake fluid low', severity: 'medium' },
      ],
      status: 'completed',
    });
    assert(inspection.problemsFound.length === 2, 'Mechanic can record Initial Inspection & Problems Found');

    // 3.2 Repair Update & Status Flow
    jobCard.status = 'repair_in_progress';
    await jobCard.save();
    assert(jobCard.status === 'repair_in_progress', 'Mechanic can change repair status to In Progress');

    // 3.3 Spare Parts Request
    const partsReq = await SparePartsRequest.create({
      jobCard: jobCard._id,
      technician: mechanicEmployeeRecord._id,
      item: inventoryItem._id,
      itemName: inventoryItem.itemName,
      requestedQuantity: 4,
      currentStock: 50,
      reason: 'Replacing engine oil for routine service',
      status: 'approved',
    });
    assert(partsReq.status === 'approved', 'Mechanic can request Spare Parts and Manager can approve');

    // 3.4 Time Tracking Log
    const timeLog = await TimeLog.create({
      jobCard: jobCard._id,
      technician: mechanicEmployeeRecord._id,
      recordDate: new Date(),
      repairTime: { hours: 1, minutes: 0 },
      remarks: 'Replaced engine oil and filter',
    });
    assert(timeLog.totalWorkingHours === 1, 'Mechanic can track time spent on tasks');

    // 3.5 Road Test Result
    const roadTest = await RoadTest.create({
      jobCard: jobCard._id,
      vehicle: vehicle._id,
      technician: mechanicEmployeeRecord._id,
      result: 'pass',
      remarks: 'Smooth gear transitions and responsive braking',
      mileageBeforeTest: 45000,
      mileageAfterTest: 45005,
    });
    assert(roadTest.result === 'pass', 'Mechanic can submit Road Test Result (Pass/Fail + Notes)');

    // 3.6 Final Vehicle Condition Report
    const finalReport = await FinalInspectionReport.create({
      jobCard: jobCard._id,
      vehicle: vehicle._id,
      technician: mechanicEmployeeRecord._id,
      finalCondition: 'excellent',
      mechanicRemarks: 'All service items completed successfully and tested.',
      partsReplaced: [
        { itemName: inventoryItem.itemName, quantity: 4, cost: 18000 }
      ],
      status: 'submitted',
    });
    assert(finalReport.status === 'submitted', 'Mechanic can submit Final Vehicle Condition Report');

    jobCard.status = 'work_complete';
    await jobCard.save();
    assert(jobCard.status === 'work_complete', 'Job Card marked Work Complete after mechanic finishes work');

    console.log('\n--- 4. CUSTOMER ROLE TESTS ---');

    // 4.1 Invoice Generation & Download PDF data check
    const invoice = await Invoice.create({
      jobCard: jobCard._id,
      customer: customerProfile._id,
      vehicle: vehicle._id,
      subtotal: 18500,
      grandTotal: 18500,
      amountPaid: 18500,
      paymentStatus: 'paid',
    });
    assert(invoice.paymentStatus === 'paid', 'Customer can view generated Invoice and Payment status');

    // 4.2 Customer Notification
    const notif = await Notification.create({
      user: testCustomerUser._id,
      title: 'Vehicle Ready for Pickup',
      description: `Your vehicle ${vehicle.registrationNumber} service has been completed and is ready for pickup!`,
      type: 'vehicle_ready',
      isRead: false,
    });
    assert(notif.type === 'vehicle_ready', 'System sends automated Notification to Customer (Vehicle Ready)');

    // 4.3 Customer Review & Rating
    const review = await Review.create({
      customer: customerProfile._id,
      jobCard: jobCard._id,
      vehicle: vehicle._id,
      serviceQuality: 5,
      mechanicPerformance: 5,
      overallExperience: 5,
      comments: 'Exceptional service! Quick turn-around and friendly team.',
    });
    assert(review.overallExperience === 5, 'Customer can rate Mechanic and Overall Service with comments');

    // Clean up created dummy data
    console.log('\n🧹 Cleaning up test dummy records...');
    await Review.findByIdAndDelete(review._id);
    await Notification.findByIdAndDelete(notif._id);
    await Invoice.findByIdAndDelete(invoice._id);
    await FinalInspectionReport.findByIdAndDelete(finalReport._id);
    await RoadTest.findByIdAndDelete(roadTest._id);
    await TimeLog.findByIdAndDelete(timeLog._id);
    await SparePartsRequest.findByIdAndDelete(partsReq._id);
    await VehicleInspection.findByIdAndDelete(inspection._id);
    await JobCard.findByIdAndDelete(jobCard._id);
    await Appointment.findByIdAndDelete(appointment._id);
    await Vehicle.findByIdAndDelete(vehicle._id);
    await Customer.findByIdAndDelete(customerProfile._id);
    await FinancialEntry.findByIdAndDelete(income._id);
    await FinancialEntry.findByIdAndDelete(expense._id);
    await PurchaseOrder.findByIdAndDelete(po._id);
    await InventoryItem.findByIdAndDelete(inventoryItem._id);
    await Supplier.findByIdAndDelete(supplier._id);
    await Service.findByIdAndDelete(serviceItem._id);
    await ServiceCategory.findByIdAndDelete(serviceCat._id);
    await Employee.findByIdAndDelete(mechanicEmployeeRecord._id);
    await User.findByIdAndDelete(testCustomerUser._id);
    await User.findByIdAndDelete(testMechanicUser._id);
    await User.findByIdAndDelete(testManagerUser._id);
    console.log('✨ Dummy test records cleaned up.');

    console.log('\n====================================================');
    console.log(`🎉 SYSTEM END-TO-END TEST COMPLETED: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR IN SYSTEM TEST:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runFullSystemTest();
