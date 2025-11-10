import {
	browseFlow,
	cartFlow,
	setCheckoutRatio,
	setQuickBuyRatio,
	setAbandonRatio,
} from "./main.js";
export { browseFlow, cartFlow };

setCheckoutRatio(1.0); 
setQuickBuyRatio(0.5); 
setAbandonRatio(0.1); 

export const options = {
	discardResponseBodies: false,
	systemTags: ["status", "method", "name", "scenario", "group", "check"],
	thresholds: {
		http_req_failed: ["rate<0.02"],
		"http_req_duration{scenario:browse}": ["p(95)<2000"],
		"http_req_duration{scenario:cart}": ["p(95)<4000"],
		"iteration_duration{scenario:browse}": ["p(95)<8000"],
		"iteration_duration{scenario:cart}": ["p(95)<12000"],
		dropped_iterations: ["count==0"],
		branch_quick: ["count>0"],
		branch_standard: ["count>0"],
		branch_checkout: ["count>0"],
	},
	scenarios: {
		browse: {
			executor: "constant-arrival-rate",
			exec: "browseFlow",
			rate: 3,
			timeUnit: "1s",
			duration: "1m20s",
			preAllocatedVUs: 6,
			maxVUs: 20,
			gracefulStop: "10s",
		},
		cart: {
			executor: "constant-arrival-rate",
			exec: "cartFlow",
			rate: 1,
			timeUnit: "1s",
			duration: "1m20s",
			preAllocatedVUs: 4,
			maxVUs: 16,
			gracefulStop: "10s",
		},
	},
};
