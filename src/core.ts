/* 輸入 Type */
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

/* 輸出 Type */
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

/* 核心函數 */
export function splitBill(input: BillInput): BillOutput {
  let date = formatDate(input.date);
  let location = input.location;
  let subTotal = calculateSubTotal(input.items);
  let tip = calculateTip(subTotal, input.tipPercentage);
  let totalAmount = subTotal + tip;
  let items = calculateItems(input.items, input.tipPercentage);
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
  return Math.round((subTotal * tipPercentage) / 100 * 10) / 10; // 四捨五入至最近 $0.1
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

function calculateItems(items: BillItem[], tipPercentage: number): PersonItem[] {
  const names = scanPersons(items);
  const personsCount = names.length;
  return names.map(name => ({
    name,
    amount: calculatePersonAmount({ items, tipPercentage, name, persons: personsCount }),
  }));
}

function calculatePersonAmount(input: {
  items: BillItem[];
  tipPercentage: number;
  name: string;
  persons: number;
}): number {
  let total = 0;

  input.items.forEach(item => {
    if (item.isShared) {
      total += item.price / (input.persons + 1); // 包括共享人員
    } else {
      const personalItem = item as PersonalBillItem;
      if (personalItem.person === input.name) {
        total += personalItem.price; // 個別計算
      }
    }
  });

  return Math.round(total * 10) / 10; // 四捨五入至最近 $0.1
}

function adjustAmount(totalAmount: number, items: PersonItem[]): void {
  const totalPaid = items.reduce((sum, item) => sum + item.amount, 0);
  const adjustment = totalAmount - totalPaid;

  // 按比例調整金額，確保總金額正確
  if (adjustment !== 0) {
    const adjustmentPerPerson = adjustment / items.length;

    items.forEach(item => {
      item.amount += adjustmentPerPerson; // 先做調整
    });
  }

  // 最後進行四捨五入
  items.forEach(item => {
    item.amount = Math.round(item.amount * 10) / 10; // 四捨五入至最近 $0.1
  });

  // 確保所有金額相加等於總金額
  const finalTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const finalAdjustment = totalAmount - finalTotal;

  // 將最終調整加到第一位使用者
  if (finalAdjustment !== 0) {
    items[0].amount += finalAdjustment; // 將最終調整加到第一個人
    items[0].amount = Math.round(items[0].amount * 10) / 10; // 保持四捨五入
  }
}