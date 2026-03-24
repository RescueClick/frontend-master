import DhanSourceLoader from "../DhanSourceLoader";

/**
 * Universal table loading state — same brand loader as the rest of the app.
 * Use inside `<tbody>` as a single `<tr>` or wrap block tables.
 */
export default function TableLoader({
  colSpan = 1,
  label = "Loading…",
  minHeight = "min-h-[200px]",
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={`p-0 ${minHeight}`}>
        <DhanSourceLoader size="sm" label={label} className="py-10" />
      </td>
    </tr>
  );
}
