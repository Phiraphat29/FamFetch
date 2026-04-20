import React from "react";
import { Text } from "react-native";
import { Card, Button, SurfaceVariant } from "heroui-native";

type MenuActionCardProps = {
    title: string;
    description: string;
    icon: React.ReactNode;
    buttonText: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "tertiary";
    isOutlinedButton?: boolean;
}

export default function MenuActionCard({
    title,
    description,
    icon,
    buttonText,
    onPress,
    variant,
    isOutlinedButton = false,
}: MenuActionCardProps) {
    return (
        <Card variant={variant as SurfaceVariant}>
            <Card.Header className="flex-row items-center gap-2">
                {icon}
                <Card.Title className="font-noto-bold">{title}</Card.Title>
            </Card.Header>
            <Card.Body>
                <Card.Description className="font-noto">{description}</Card.Description>
            </Card.Body>
            <Card.Footer>
                <Button
                    className={`w-full rounded-full mt-2 ${isOutlinedButton ? "bg-transparent border border-black" : "bg-black"
                        }`}
                    onPress={onPress}
                >
                    <Text
                        className={`font-noto-bold text-center ${isOutlinedButton ? "text-black" : "text-white"
                            }`}
                    >
                        {buttonText}
                    </Text>
                </Button>
            </Card.Footer>
        </Card>
    );
}