export type BillInput = {
  date: string
  location: string
  tipPercentage: number
  items: BillItem[]
}

type BillItem = SharedBillItem | PersonalBillItem

type CommonBillItem = {
  price: number
  name: string
}

type SharedBillItem = CommonBillItem & {
  isShared: true
}

type PersonalBillItem = CommonBillItem & {
  isShared: false
  person: string
}

export type BillOutput = {
  date: string
  location: string
  subTotal: number
  tip: number
  totalAmount: number
  items: PersonItem[]
}

type PersonItem = {
  name: string
  amount: number
}

export function splitBill(input: BillInput): BillOutput {
  let date = formatDate(input.date)
  let location = input.location
  let subTotal = calculateSubTotal(input.items)
  let tip = calculateTip(subTotal, input.tipPercentage)
  let totalAmount = subTotal + tip
  let items = calculateItems(input.items, input.tipPercentage)
  adjustAmount(totalAmount, items)
  
  return {
    date,
    location,
    subTotal,
    tip,
    totalAmount,
    items,
  }
}


export function formatDate(date: string): string {
}

function calculateSubTotal(items: BillItem[]): number {
}

export function calculateTip(subTotal: number, tipPercentage: number): number {
}

function scanPersons(items: BillItem[]): string[] {
}

function calculateItems(
  items: BillItem[],
  tipPercentage: number,
): PersonItem[] {
  let names = scanPersons(items)
  let persons = names.length
  return names.map(name => ({
    name,
    amount: calculatePersonAmount({
      items,
      tipPercentage,
      name,
      persons,
    }),
  }))
}

function calculatePersonAmount(input: {
  items: BillItem[]
  tipPercentage: number
  name: string
  persons: number
}): number {

}

function adjustAmount(totalAmount: number, items: PersonItem[]): void {
}
