import { List } from "@react95/core";
import { Inetcpl1319, Winhlp324000 } from "@react95/icons";

interface NavBarProps {
    className?: string;
}

function NavBar({className}: NavBarProps) {
    return (
        <nav className={className}>
            <List>
                <List.Item icon={<Inetcpl1319 variant="32x32_4"/>}></List.Item>
                <List.Item icon={<Winhlp324000 variant="32x32_4"/>}></List.Item>
            </List>
        </nav>
    );
}

export default NavBar;