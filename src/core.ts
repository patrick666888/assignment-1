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
    subTotal: roundToTwoDecimals(subTotal), // 四捨五入至兩位小數
    tip: roundToTwoDecimals(tip), // 四捨五入至兩位小數
    totalAmount: roundToTwoDecimals(totalAmount), // 四捨五入至兩位小數
    items,
  }
}

/* 格式化日期 */
export function formatDate(date: string): string {
  const parts = date.split("-");
  return `${parts[0]}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`; // 去掉前導零
}

/* 計算小計 */
function calculateSubTotal(items: BillItem[]): number {
  return items.reduce((total, item) => total + item.price, 0); // 累加所有項目的價格
}

/* 計算小費 */
export function calculateTip(subTotal: number, tipPercentage: number): number {
  const tipAmount = subTotal * (tipPercentage / 100); // 計算小費
  return roundToOneDecimal(tipAmount); // 四捨五入至最近的 0.1 元
}

/* 收集所有參與者的名稱 */
function scanPersons(items: BillItem[]): string[] {
  const persons = new Set<string>();
  items.forEach(item => {
    if (!item.isShared && item.person) {
      persons.add(item.person); // 收集個人項目的擁有者
    }
  });
  return Array.from(persons); // 返回不重複的名稱陣列
}

/* 計算每個人的金額 */
function calculateItems(items: BillItem[], tipPercentage: number): PersonItem[] {
  const names = scanPersons(items);
  const personsCount = names.length;

  return names.map(name => ({
    name,
    amount: calculatePersonAmount({
      items,
      tipPercentage,
      name,
      persons: personsCount,
    }),
  }));
}

/* 計算個人金額 */
function calculatePersonAmount(input: {
  items: BillItem[];
  tipPercentage: number;
  name: string;
  persons: number;
}): number {
  let personalAmount = 0;
  let sharedAmount = 0;

  input.items.forEach(item => {
    if (item.isShared) {
      sharedAmount += item.price / input.persons; // 平均分攤共享項目
    } else if (item.person === input.name) {
      personalAmount += item.price; // 累加個人項目
    }
  });

  const totalAmount = personalAmount + sharedAmount; // 計算總金額
  const individualTip = (totalAmount * input.tipPercentage) / 100; // 計算小費
  return roundToOneDecimal(totalAmount + individualTip); // 四捨五入至最近的 0.1 元
}

/* 調整金額以確保正確 */
function adjustAmounts(totalAmount: number, items: PersonItem[]): void {
  const currentTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const difference = totalAmount - currentTotal;

  if (Math.abs(difference) < 0.01) return; // 如果沒有誤差，直接返回

  const adjustmentPerPerson = parseFloat((difference / items.length).toFixed(1)); // 平均調整金額
  items.forEach(item => {
    item.amount = parseFloat((item.amount + adjustmentPerPerson).toFixed(1)); // 調整每個人的金額
  });

  const finalTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const finalDifference = totalAmount - finalTotal;

  // 如果仍有差異，調整第一個人的金額
  if (finalDifference !== 0) {
    items[0].amount = parseFloat((items[0].amount + finalDifference).toFixed(1));
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