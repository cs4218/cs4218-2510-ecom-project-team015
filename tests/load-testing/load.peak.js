import {
	browseFlow,
	cartFlow,
	setCheckoutRatio,
	setQuickBuyRatio,
	setAbandonRatio,
} from "./main.js";
export { browseFlow, cartFlow };

setCheckoutRatio(0.55);
setQuickBuyRatio(0.35);
setAbandonRatio(0.2);

export const options = {
	discardResponseBodies: false, 
	systemTags: ["status", "method", "name", "scenario", "group", "check"],
	thresholds: {
		http_req_failed: ["rate<0.05"], 
		"http_req_duration{scenario:browse}": ["p(95)<2500"],
		"http_req_duration{scenario:cart}": ["p(95)<5000"],
		"iteration_duration{scenario:browse}": ["p(95)<9000"],
		"iteration_duration{scenario:cart}": ["p(95)<13000"],

		dropped_iterations: ["count==0"],
		branch_checkout: ["count>0"],
		branch_abandon: ["count>0"],
		branch_merge: ["count>0"],
	},
	scenarios: {
		browse: {
			executor: "constant-arrival-rate",
			exec: "browseFlow",
			rate: 12,
			timeUnit: "1s", 
			duration: "5m",
			preAllocatedVUs: 60,
			maxVUs: 160,
			gracefulStop: "10s",
		},
		cart: {
			executor: "constant-arrival-rate",
			exec: "cartFlow",
			rate: 5,
			timeUnit: "1s", 
			duration: "5m",
			preAllocatedVUs: 40,
			maxVUs: 110,
			gracefulStop: "10s",
		},
	},
};
