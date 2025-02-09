export type BillInput = { //輸入
  date: string;
  location: string;
  tipPercentage: number;
  items: BillItem[];
};

type BillItem = SharedBillItem | PersonalBillItem;

type CommonBillItem = {
  price: number;
  name: string;
};

type SharedBillItem = CommonBillItem & {
  isShared: true;
};

type PersonalBillItem = CommonBillItem & {
  isShared: false;
  person: string;
};

export type BillOutput = {
  date: string;
  location: string;
  subTotal: number;
  tip: number;
  totalAmount: number;
  items: PersonItem[];
};

type PersonItem = {
  name: string;
  amount: number;
};

export function splitBill(input: BillInput): BillOutput {
  const date = formatDate(input.date);
  const location = input.location;
  const subTotal = calculateSubTotal(input.items);
  const tip = calculateTip(subTotal, input.tipPercentage);
  const totalAmount = subTotal + tip;

  const names = scanPersons(input.items);
  const persons = names.length;

  const items = names.map(name => ({
    name,
    amount: roundToOneDecimal(
      calculatePersonAmount({
        items: input.items,
        tipPercentage: input.tipPercentage,
        name,
        persons,
      })
    ),
  }));

  adjustAmount(totalAmount, items);

  return {
    date,
    location,
    subTotal: roundToTwoDecimals(subTotal),
    tip: roundToTwoDecimals(tip),
    totalAmount: roundToTwoDecimals(totalAmount),
    items,
  };
}

export function formatDate(date: string): string { //日期格式
  const [year, month, day] = date.split('-');
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

function calculateSubTotal(items: BillItem[]): number { 
  return items.reduce((total, item) => total + item.price, 0);
}

export function calculateTip(subTotal: number, tipPercentage: number): number { //TIPS
  const tip = (subTotal * tipPercentage) / 100;
  return roundToOneDecimal(tip);
}

function scanPersons(items: BillItem[]): string[] { //人名
  const persons = new Set<string>();
  for (const item of items) {
    if (!item.isShared && item.person) {
      persons.add(item.person);
    }
  }
  return Array.from(persons);
}

function calculatePersonAmount(input: { //人分帳
  items: BillItem[];
  tipPercentage: number;
  name: string;
  persons: number;
}): number {
  const { items, tipPercentage, name, persons } = input;

  let amount = 0;
  let sharedTotal = 0;

  for (const item of items) {
    if (item.isShared) {
      sharedTotal += item.price;
    } else if (item.person === name) {
      amount += item.price;
    }
  }

  amount += sharedTotal / persons;

  const subTotal = calculateSubTotal(items);
  const tip = calculateTip(subTotal, tipPercentage);
  amount += (amount / subTotal) * tip;

  return amount;
}

function adjustAmount(totalAmount: number, items: PersonItem[]): void { //ROUND
  const totalRounded = items.reduce((sum, item) => sum + item.amount, 0);
  const roundingError = roundToOneDecimal(totalAmount - totalRounded);

  if (Math.abs(roundingError) > 0.01) {
    items[0].amount += roundingError;
    items[0].amount = roundToOneDecimal(items[0].amount); 
  }
}

function roundToOneDecimal(value: number): number {//取至一位小數
  return Math.round(value * 10) / 10;
}
function roundToTwoDecimals(value: number): number { //取至兩位小數
  return Math.round(value * 100) / 100;
}