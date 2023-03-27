export type Tabs = {
  setChecked: (dataRadioName: string) => void;
};
export type TabsOptions = {
  /** Specify a target element to set up the tabs component. */
  element: HTMLElement;
};

/** Setup tabs component. */
export function setupTabs({ element }: TabsOptions): Tabs {
  return {
    setChecked: (dataRadioName) => {
      const radio = element.querySelector<HTMLInputElement>(
        `input[data-radio-name="${dataRadioName}"]`
      )!;

      radio.checked = true;
    },
  };
}
