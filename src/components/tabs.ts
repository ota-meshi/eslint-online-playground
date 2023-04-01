import type { Ref } from "vue";

export type Tab = {
  readonly title: string;
  readonly name: string;
  active: boolean;
  order: number;
  removable: boolean;
};

const usedNames = new Set<string>();

export function getUniqueName(): string {
  let name = Math.random().toString(32).substring(2);
  while (usedNames.has(name)) {
    name = Math.random().toString(32).substring(2);
  }
  return name;
}

export function sortTabs(tabs: Ref<Tab>[]): Ref<Tab>[] {
  return tabs.sort((a, b) => {
    if (a.value.order < b.value.order) {
      return -1;
    }
    if (a.value.order > b.value.order) {
      return 1;
    }
    return 0;
  });
}
