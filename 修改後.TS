export type BillInput = {
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
  person: string; // 必需的屬性
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
  const items = calculateItems(input.items, input.tipPercentage);
  adjustAmount(totalAmount, items);
  
  return {
    date,
    location,
    subTotal,
    tip,
    totalAmount,
    items,
  };
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

function calculateSubTotal(items: BillItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function calculateTip(subTotal: number, tipPercentage: number): number {
  const tip = (subTotal * tipPercentage) / 100;
  return Math.round(tip * 10) / 10; // 四捨五入至最近 $0.1
}

function scanPersons(items: BillItem[]): string[] {
  const personsSet = new Set<string>();
  items.forEach(item => {
    if (!item.isShared && 'person' in item) {
      personsSet.add(item.person);
    }
  });
  return Array.from(personsSet);
}

function calculateItems(
  items: BillItem[],
  tipPercentage: number,
): PersonItem[] {
  const names = scanPersons(items);
  const personsCount = names.length;
  return names.map(name => ({
    name,
    amount: calculatePersonAmount({
      items,
      tipPercentage,
      name,
      personsCount,
    }),
  }));
}

function calculatePersonAmount(input: {
  items: BillItem[];
  tipPercentage: number;
  name: string;
  personsCount: number;
}): number {
  let total = 0;

  input.items.forEach(item => {
    if (item.isShared) {
      total += item.price / input.personsCount; // 平均分擔
    } else {
      const personalItem = item as PersonalBillItem; // 確保作為 PersonalBillItem 處理
      if (personalItem.person === input.name) {
        total += personalItem.price; // 個別計算
      }
    }
  });

  const subTotal = calculateSubTotal(input.items);
  const tip = calculateTip(subTotal, input.tipPercentage);
  return Math.round((total + tip) * 10) / 10; // 四捨五入至最近 $0.1
}

function adjustAmount(totalAmount: number, items: PersonItem[]): void {
  const totalPaid = items.reduce((sum, item) => sum + item.amount, 0);
  const adjustment = totalAmount - totalPaid;

  // 調整金額
  items.forEach(item => {
    item.amount += adjustment / items.length;
    item.amount = Math.round(item.amount * 10) / 10; // 四捨五入至最近 $0.1
  });
}