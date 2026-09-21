// Explicitly run against service_center_dev. Retains clearly labelled demo records.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import JobCard from '../models/JobCard.js';
import '../models/Employee.js';
import InventoryItem from '../models/InventoryItem.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import quotationRoutes from '../routes/quotationRoutes.js';

dotenv.config();
assert.equal(new URL(process.env.MONGODB_URI).pathname, '/service_center_dev', 'Only the development database is allowed');
let server;
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([Quotation.init(), Invoice.init()]);
  const manager = await User.findOne({ role: 'manager', isActive: true });
  assert.ok(manager, 'An active manager is required');
  let demoUser = await User.findOne({ username: 'quotation-demo' });
  if (!demoUser) demoUser = await User.create({ username: 'quotation-demo', email: 'quotation-demo@example.invalid',
    password: randomBytes(32).toString('hex'), firstName: 'Quotation', lastName: 'Demo', role: 'customer', isActive: false });
  let customer = await Customer.findOne({ user: demoUser._id });
  if (!customer) customer = await Customer.create({ user: demoUser._id, notes: 'Quotation feature verification sample' });
  let vehicle = await Vehicle.findOne({ registrationNumber: 'DEMO-QTN' });
  if (!vehicle) vehicle = await Vehicle.create({ vehicleId: 'VEH-DEMO-QTN', customer: customer._id, registrationNumber: 'DEMO-QTN', make: 'Toyota', model: 'Corolla', manufactureYear: 2020 });
  let job = await JobCard.findOne({ vehicle: vehicle._id });
  if (!job) job = await JobCard.create({ jobCardNumber: 'JC-DEMO-QTN', customer: customer._id, vehicle: vehicle._id, complaint: 'DEMO: quotation workflow verification', status: 'pending' });
  const part = await InventoryItem.findOne({ quantity: { $gt: 0 } });
  assert.ok(part, 'An inventory part is required');

  const app = express(); app.use(express.json()); app.use('/api/quotations', quotationRoutes);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/quotations`;
  const token = jwt.sign({ id: manager._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const request = async (method, path = '', body, expected = 200) => {
    const res = await fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const result = await res.json(); assert.equal(res.status, expected, result.message); return result;
  };
  const data = { customer: String(customer._id), vehicle: String(vehicle._id), jobCard: String(job._id),
    items: [{ part: String(part._id), name: part.itemName, quantity: 2, unitPrice: 5500, discount: 500, total: 1 }],
    laborCharge: 3500, estimatedHours: 2, discount: 1000, taxRate: 18, notes: 'DEMO: quotation workflow verification' };
  await request('POST', '', { ...data, laborCharge: -1 }, 400);
  await request('POST', '', { ...data, items: null }, 400);
  await request('POST', '', { ...data, vehicle: String(new mongoose.Types.ObjectId()) }, 400);
  const created = (await request('POST', '', data, 201)).data;
  assert.equal(created.grandTotal, 19470);
  const id = '/' + created._id;
  await request('PUT', id + '/approve', {}, 400);
  const updated = (await request('PUT', id, { estimatedHours: 3, grandTotal: 1, status: 'approved' })).data;
  assert.equal(updated.status, 'draft'); assert.equal(updated.grandTotal, 23600);
  await request('PUT', id + '/submit', {});
  await request('PUT', id, { notes: 'should not change' }, 400);
  const approved = (await request('PUT', id + '/approve', {})).data;
  assert.ok(approved.approvedAt);
  const invoice = (await request('POST', id + '/convert', {}, 201)).data;
  assert.equal(invoice.grandTotal, 23600); assert.equal(invoice.discount, 1000);
  assert.equal(invoice.items[0].description, part.itemName);
  assert.equal(String(invoice.quotation), created._id);
  await request('POST', id + '/convert', {}, 400);
  assert.equal(await Invoice.countDocuments({ quotation: created._id }), 1);
  const rejected = (await request('POST', '', { ...data, notes: 'DEMO: rejected quotation' }, 201)).data;
  await request('PUT', '/' + rejected._id + '/submit', {});
  await request('PUT', '/' + rejected._id + '/reject', { rejectionReason: ' ' }, 400);
  await request('PUT', '/' + rejected._id + '/reject', { rejectionReason: 'Demo customer deferred service' });
  assert.equal((await request('GET', '/' + rejected._id)).data.rejectionReason, 'Demo customer deferred service');
  const draft = (await request('POST', '', { ...data, notes: 'DEMO: editable quotation with parts, labor, discount and tax' }, 201)).data;
  const list = await request('GET', '?limit=100');
  assert.ok(list.data.some(q => q._id === draft._id && q.grandTotal === 19470));
  console.log(JSON.stringify({ result: 'PASS', converted: created.quotationNumber, invoice: invoice.invoiceNumber,
    rejected: rejected.quotationNumber, draft: draft.quotationNumber, draftId: draft._id, draftTotal: draft.grandTotal }, null, 2));
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
}
