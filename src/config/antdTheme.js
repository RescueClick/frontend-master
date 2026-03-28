/** Aligns Ant Design with DhanSource teal / Tailwind brand tokens */
export const antdThemeConfig = {
  token: {
    colorPrimary: "#0d9488",
    colorPrimaryHover: "#0f766e",
    colorLink: "#0d9488",
    borderRadius: 8,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Table: {
      headerBg: "#0d9488",
      headerColor: "#ffffff",
      headerSplitColor: "transparent",
      headerBorderRadius: 0,
      rowHoverBg: "#f0fdfa",
      borderColor: "#e5e7eb",
      cellFontSize: 13,
      cellPaddingBlock: 12,
      cellPaddingInline: 12,
    },
    Pagination: {
      itemActiveBg: "#ccfbf1",
      margin: 16,
    },
  },
};
