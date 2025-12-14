import { Alert, Button, Checkbox, Flex, Input, Space, Typography, Upload, theme } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { Task } from "@/entities/course/model/types.ts";
import { getCourseStyles } from "@/pages/course-content/ui/styles/courseContentStyles.ts";
import type { CSSProperties } from "react";

const { useToken } = theme;

interface BaseTaskProps {
    task: Task;
    isSubmitting: boolean;
    onChange: (value: any) => void;
    onRetake: () => void;
}

interface MultipleChoiceProps extends BaseTaskProps {
    responseId: string;
}

interface MultipleSelectProps extends BaseTaskProps {
    responseIds: string[];
}

interface ShortAnswerProps extends BaseTaskProps {
    response: string;
}

interface UploadProps extends BaseTaskProps {
    responseFile: File | null;
}

const TaskFeedback = ({ task, onRetake, styles }: { task: Task; onRetake: () => void; styles: any }) => {
    if (!task.completed || !task.evaluation) return null;

    const { isCorrect, score, mistakes } = task.evaluation;

    return (
        <Flex vertical gap={16}>
            <Alert
                type={isCorrect ? 'success' : 'error'}
                message={isCorrect ? 'Correct' : 'Incorrect'}
                description={typeof score === 'number' ? `Score: ${Math.round(score * 100)}%` : undefined}
                showIcon
            />

            {!isCorrect && mistakes && mistakes.length > 0 && (
                <Flex vertical gap={8} style={styles.feedbackBox}>
                    <Typography.Text strong>Feedback:</Typography.Text>
                    <Flex vertical gap={4} style={{ fontSize: '0.875rem', marginTop: 8 }}>
                        {mistakes.map((m, idx) => (
                            <Flex key={idx} align="flex-start" gap={8}>
                                <span>•</span>
                                <span>{m}</span>
                            </Flex>
                        ))}
                    </Flex>
                </Flex>
            )}

            {!isCorrect && (
                <Flex gap={8}>
                    <Button size="small" onClick={onRetake}>Retake</Button>
                </Flex>
            )}
        </Flex>
    );
};

const MultipleChoiceTask = (props: MultipleChoiceProps) => {
    const { token } = useToken();
    const styles = getCourseStyles(token);

    return (
        <Flex vertical gap={16}>
            <Flex vertical gap={8}>
                {props.task.options?.map((option, index) => {
                    const isSelected = props.responseId === option.id;
                    const isCorrectOption = option.id === props.task.correctAnswerId;

                    let labelStyle: CSSProperties = { cursor: props.task.completed ? 'default' : 'pointer' };

                    if (props.task.completed) {
                        if (isCorrectOption) {
                            labelStyle = { ...labelStyle, color: token.colorSuccess, fontWeight: 500 };
                        } else if (isSelected && !isCorrectOption) {
                            labelStyle = { ...labelStyle, color: token.colorError, fontWeight: 500 };
                        }
                    }

                    return (
                        <Space key={index} align="center">
                            <Checkbox
                                id={`${props.task.id}-mc-${index}`}
                                checked={isSelected}
                                onChange={(e) => {
                                    if (props.task.completed) return;
                                    if (e.target.checked) props.onChange(option.id);
                                }}
                                disabled={props.task.completed || props.isSubmitting}
                            />
                            <label htmlFor={`${props.task.id}-mc-${index}`} style={labelStyle}>
                                {option.label}
                            </label>
                        </Space>
                    );
                })}
            </Flex>
            <TaskFeedback task={props.task} onRetake={props.onRetake} styles={styles} />
        </Flex>
    );
};

const MultipleSelectTask = (props: MultipleSelectProps) => {
    const { token } = useToken();
    const styles = getCourseStyles(token);
    const safeValue = Array.isArray(props.responseIds) ? props.responseIds : [];

    const handleToggle = (optionId: string) => {
        if (props.task.completed) return;
        const newValue = safeValue.includes(optionId)
            ? safeValue.filter(id => id !== optionId)
            : [...safeValue, optionId];
        props.onChange(newValue);
    };

    return (
        <Flex vertical gap={16}>
            <Flex vertical gap={8}>
                {props.task.options?.map((option, index) => {
                    const isSelected = safeValue.includes(option.id);
                    const isCorrectOption = props.task.correctAnswerIds?.includes(option.id);

                    let labelStyle: CSSProperties = { cursor: props.task.completed ? 'default' : 'pointer' };

                    if (props.task.completed) {
                        if (isCorrectOption) {
                            labelStyle = { ...labelStyle, color: token.colorSuccess, fontWeight: 500 };
                        } else if (isSelected && !isCorrectOption) {
                            labelStyle = { ...labelStyle, color: token.colorError, fontWeight: 500 };
                        }
                    }

                    return (
                        <Space key={index} align="center">
                            <Checkbox
                                id={`${props.task.id}-ms-${index}`}
                                checked={isSelected}
                                onChange={() => handleToggle(option.id)}
                                disabled={props.task.completed || props.isSubmitting}
                            />
                            <label htmlFor={`${props.task.id}-ms-${index}`} style={labelStyle}>
                                {option.label}
                            </label>
                        </Space>
                    );
                })}
            </Flex>
            <TaskFeedback task={props.task} onRetake={props.onRetake} styles={styles} />
        </Flex>
    );
};

const ShortAnswerTask = (props: ShortAnswerProps) => {
    const { token } = useToken();
    const styles = getCourseStyles(token);

    return (
        <Flex vertical gap={16}>
            {props.task.completed && (
                <Typography.Text strong>Your answer</Typography.Text>
            )}
            <Input.TextArea
                placeholder="Enter your answer..."
                value={props.task.completed ? (props.task.userAnswer || '') : (props.response || '')}
                onChange={(e) => props.onChange(e.target.value)}
                disabled={props.task.completed || props.isSubmitting}
                rows={4}
            />
            {props.isSubmitting && (
                <Typography.Text type="secondary">Evaluating answer...</Typography.Text>
            )}
            <TaskFeedback task={props.task} onRetake={props.onRetake} styles={styles} />
        </Flex>
    );
};

const UploadPdfTask = (props: UploadProps) => {
    const { token } = useToken();
    const styles = getCourseStyles(token);

    const displayFileName = props.task.completed ? props.task.userFileName : props.responseFile?.name;

    return (
        <Flex vertical gap={16}>
            <Upload
                beforeUpload={(file) => {
                    props.onChange(file);
                    return false;
                }}
                showUploadList={false}
                disabled={props.task.completed || props.isSubmitting}
                accept="application/pdf"
            >
                <Button
                    icon={<UploadOutlined />}
                    disabled={props.task.completed || props.isSubmitting}
                >
                    Upload PDF
                </Button>
            </Upload>

            {displayFileName && (
                <Flex style={styles.infoTone}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                        <strong>{props.task.completed ? 'Uploaded file:' : 'Selected:'}</strong> {displayFileName}
                    </p>
                </Flex>
            )}

            {!displayFileName && !props.task.completed && (
                <Typography.Text type="secondary">No file selected</Typography.Text>
            )}

            {props.isSubmitting && (
                <Typography.Text type="secondary">Validating PDF...</Typography.Text>
            )}

            <TaskFeedback task={props.task} onRetake={props.onRetake} styles={styles} />
        </Flex>
    );
};

export interface TaskItemProps {
    task: Task;
    value: any;
    isSubmitting: boolean;
    onChange: (value: any) => void;
    onRetake: () => void;
}

export const TaskItem = (props: TaskItemProps) => {
    switch (props.task.type) {
        case 'multiple-choice':
            return <MultipleChoiceTask {...props} responseId={props.value as string} />;
        case 'multiple-select':
            return <MultipleSelectTask {...props} responseIds={props.value as string[]} />;
        case 'short-answer':
        case 'code':
            return <ShortAnswerTask {...props} response={props.value as string} />;
        case 'upload-pdf':
            return <UploadPdfTask {...props} responseFile={props.value as File} />;
        default:
            return <Alert message="Unknown task type" type="warning" />;
    }
};

