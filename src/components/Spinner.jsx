import { PulseLoader } from "react-spinners";
import styles from "./Spinner.module.css";

function Spinner({ size = 10 }) {
  return (
    <div className={styles.wrapper}>
      <PulseLoader color="var(--primary-500)" size={size} />
    </div>
  );
}

export default Spinner;