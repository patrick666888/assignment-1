/* 輸入 Type */
export type BillInput = {
  date: string; // 日期，格式為 YYYY-MM-DD
  location: string; // 餐廳位置
  tipPercentage: number; // 小費百分比
  items: BillItem[]; // 餐費項目
}

type BillItem = SharedBillItem | PersonalBillItem;

type CommonBillItem = {
  price: number; // 價格
  name: string; // 名稱
}

type SharedBillItem = CommonBillItem & {
  isShared: true; // 共享項目
}

type PersonalBillItem = CommonBillItem & {
  isShared: false; // 個人項目
  person: string; // 擁有者
}

/* 輸出 Type */
export type BillOutput = {
  date: string; // 格式化後的日期
  location: string; // 餐廳位置
  subTotal: number; // 不含小費的總金額
  tip: number; // 小費金額
  totalAmount: number; // 含小費的總金額
  items: PersonItem[]; // 每個人應付的金額
}

type PersonItem = {
  name: string; // 個人名稱
  amount: number; // 應付金額
}

/* 核心函數 */
export function splitBill(input: BillInput): BillOutput {
  const date = formatDate(input.date);
  const location = input.location;
  const subTotal = calculateSubTotal(input.items);
  const tip = calculateTip(subTotal, input.tipPercentage);
  const totalAmount = subTotal + tip;

  const items = calculateItems(input.items, input.tipPercentage);
  adjustAmounts(totalAmount, items);

  return {
    date,
    location,
    subTotal: roundToTwoDecimals(subTotal),
    tip: roundToTwoDecimals(tip),
    totalAmount: roundToTwoDecimals(totalAmount),
    items,
  }
}

/* 格式化日期 */
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

/* 計算小計 */
function calculateSubTotal(items: BillItem[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

/* 計算小費 */
export function calculateTip(subTotal: number, tipPercentage: number): number {
  return roundToOneDecimal(subTotal * (tipPercentage / 100));
}

/* 收集所有參與者的名稱 */
function scanPersons(items: BillItem[]): string[] {
  return Array.from(new Set(items
    .filter((item): item is PersonalBillItem => !item.isShared) // 確保是 PersonalBillItem
    .map(item => item.person)
  ));
}

/* 計算每個人的金額 */
function calculateItems(items: BillItem[], tipPercentage: number): PersonItem[] {
  const names = scanPersons(items);
  const personsCount = names.length;

  return names.map(name => ({
    name,
    amount: calculatePersonAmount(items, tipPercentage, name, personsCount),
  }));
}

/* 計算個人金額 */
function calculatePersonAmount(items: BillItem[], tipPercentage: number, name: string, persons: number): number {
  const { personalAmount, sharedAmount } = items.reduce((acc, item) => {
    if (item.isShared) {
      acc.sharedAmount += item.price / persons;
    } else if (item.person === name) {
      acc.personalAmount += item.price;
    }
    return acc;
  }, { personalAmount: 0, sharedAmount: 0 });

  const totalAmount = personalAmount + sharedAmount;
  const individualTip = (totalAmount * tipPercentage) / 100;
  return roundToOneDecimal(totalAmount + individualTip);
}

/* 調整金額以確保正確 */
function adjustAmounts(totalAmount: number, items: PersonItem[]): void {
  const currentTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const difference = totalAmount - currentTotal;

  if (Math.abs(difference) < 0.01) return;

  const adjustmentPerPerson = parseFloat((difference / items.length).toFixed(1));
  items.forEach(item => {
    item.amount = parseFloat((item.amount + adjustmentPerPerson).toFixed(1));
  });

  const finalTotal = items.reduce((sum, item) => sum + item.amount, 0);
  if (finalTotal !== totalAmount) {
    items[0].amount = parseFloat((items[0].amount + (totalAmount - finalTotal)).toFixed(1));
  }
}

/* 四捨五入到 1 位小數 */
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/* 四捨五入到 2 位小數 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
