import gadmActive from "@/services/mockdata/gadmActive";
import gadmInactive from "@/services/mockdata/gadmInactive";
import nuts3Active from "@/services/mockdata/nuts3Active";
import nuts3Inactive from "@/services/mockdata/nuts3Inactive";
import urauActive from "@/services/mockdata/urauActive";
import urauInactive from "@/services/mockdata/urauInactive";

export default {
    active: {
        gadm: gadmActive,
        nuts3: nuts3Active,
        urau: urauActive,
    },
    inactive: {
        gadm: gadmInactive,
        nuts3: nuts3Inactive,
        urau: urauInactive
    }
}
