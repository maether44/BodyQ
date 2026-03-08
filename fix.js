const fs=require('fs');

// Fix 1: useFoodScanner import path
let c=fs.readFileSync('src/components/food-scanner/useFoodScanner.js','utf8');
c=c.replace('from "./foodScannerApi"','from "../../services/foodScannerApi"');
c=c.replace("from './foodScannerApi'","from '../../services/foodScannerApi'");
fs.writeFileSync('src/components/food-scanner/useFoodScanner.js',c);
console.log('FIXED useFoodScanner');
console.log(c.split('\n').find(l=>l.includes('foodScannerApi')));

// Fix 2: useNutrition - stop infinite loading when no auth
let n=fs.readFileSync('src/hooks/useNutrition.js','utf8');
if(!n.includes('else setLoading(false)')) {
  n=n.replace(
    'if (data?.user) setUserId(data.user.id);',
    'if (data?.user) setUserId(data.user.id);\n            else setLoading(false);'
  );
  fs.writeFileSync('src/hooks/useNutrition.js',n);
  console.log('FIXED useNutrition loading');
} else {
  console.log('useNutrition already fixed');
}
