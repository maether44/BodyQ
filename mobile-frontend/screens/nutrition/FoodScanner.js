import FoodScannerScreen from "../../components/FoodScanner/FoodScannerScreen";
import { MACROS, TODAY } from "../../data/mockUser";

export default function FoodScanner({ navigation }) {
  return (
    <FoodScannerScreen
      onClose={() => navigation.goBack()}
      onLogged={() => navigation.goBack()}
      onLogFood={async () => true}
      goalType="general_health"
      currentCalories={TODAY.calories.eaten}
      currentProtein={TODAY.protein.eaten}
      currentCarbs={TODAY.carbs.eaten}
      currentFat={TODAY.fat.eaten}
      goalCalories={2000}
      goalProtein={MACROS.protein}
      goalCarbs={MACROS.carbs}
      goalFat={MACROS.fat}
    />
  );
}

