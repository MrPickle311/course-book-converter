package com.bcc.notifications.service

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.CopyOnWriteArrayList

@Service
class NotificationService {
    private val logger = LoggerFactory.getLogger(this::class.java)

    private val emitters = CopyOnWriteArrayList<SseEmitter>()

    fun sendNotification(message: String) {
        for (emitter in emitters) {
            try {
                emitter.send(
                    SseEmitter
                        .event()
                        .name("notification")
                        .data(message))
                logger.info("Sent event: $message")
            } catch (e: Exception) {
                logger.error("Error while sending notification: ${e.message}")
                emitters.remove(emitter)
            }
        }
    }

    fun cleanupOnDisconnectionOrTimeout(emitter: SseEmitter) {
        emitter.onCompletion { emitters.remove(emitter) }
        emitter.onError { emitters.remove(emitter) }
        emitter.onTimeout { emitters.remove(emitter) }
    }

    fun addEmitter(emitter: SseEmitter) {
        emitters.add(emitter)
    }
}