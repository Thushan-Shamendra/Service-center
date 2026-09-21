import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Quotation from '../models/Quotation.js';
import Customer from '../models/Customer.js';
import { getQuotations, getQuotationById } from '../controllers/quotationController.js';

const quote = overrides => new Quotation({
  customer: new mongoose.Types.ObjectId(), vehicle: new mongoose.Types.ObjectId(),
  items: [{ name: 'Oil filter', quantity: 2, unitPrice: 5500, discount: 500, total: 1 }],
  laborCharge: 3500, estimatedHours: 2, discount: 1000, taxRate: 18,
  ...overrides,
});

test('calculates line discounts, labor, quote discount and tax, ignoring supplied totals', async () => {
  const q = quote({ grandTotal: 1 });
  await q.validate();
  assert.equal(q.items[0].total, 10500);
  assert.equal(q.subtotal, 17500);
  assert.equal(q.taxAmount, 2970);
  assert.equal(q.grandTotal, 19470);
  q.items[0].quantity = 3;
  await q.validate();
  assert.equal(q.grandTotal, 25960);
});

test('rejects negative charges, invalid quantities, and excessive discounts', async () => {
  for (const data of [ { laborCharge: -1 }, { estimatedHours: -1 }, { taxRate: 101 },
    { discount: 999999 }, { items: [{ name: 'Part', quantity: 0, unitPrice: 1 }] },
    { items: [{ name: 'Part', quantity: 1, unitPrice: 10, discount: 11 }] } ]) {
    await assert.rejects(quote(data).validate(), { name: 'ValidationError' });
  }
});

test('supports labor-only quotes and rounds money to cents', async () => {
  const q = quote({ items: [], laborCharge: 100.01, estimatedHours: 1.5, discount: 0, taxRate: 18 });
  await q.validate();
  assert.equal(q.subtotal, 150.02);
  assert.equal(q.taxAmount, 27);
  assert.equal(q.grandTotal, 177.02);
});

const response = () => ({ statusCode: 200, body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('customer without a profile cannot list other customers quotations', async t => {
  t.mock.method(Customer, 'findOne', async () => null);
  const res = response();
  await getQuotations({ query: {}, user: { role: 'customer', _id: new mongoose.Types.ObjectId() } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.data, []);
  assert.equal(res.body.pagination.total, 0);
});

test('customer cannot read another customers quotation by ID', async t => {
  const q = quote({});
  const query = { populate() { return this; }, then(resolve) { return Promise.resolve(q).then(resolve); } };
  t.mock.method(Quotation, 'findById', () => query);
  t.mock.method(Customer, 'findOne', async () => ({ _id: new mongoose.Types.ObjectId() }));
  const res = response();
  await getQuotationById({ params: { id: String(q._id) }, user: { role: 'customer' } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.data, undefined);
});
