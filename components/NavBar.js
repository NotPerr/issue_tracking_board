import { Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import AuthStatus from "@/components/AuthStatus";

import { Popover } from "antd";

export default function NavBar() {
  return (
    <nav className="flex w-full justify-between pt-7 px-5">
      <div></div>
      <div>
        <Popover
          content={<AuthStatus />}
          trigger="click"
          placement="leftBottom"
        >
          <Button type="text" icon={<UserOutlined />} size="large" />
        </Popover>
      </div>
    </nav>
  );
}
